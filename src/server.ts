import app, { logger } from "./app";
import cron from "node-cron";
import http from "http";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";
import { ioHandler } from "./socket";

import Tenant from "./models/tenant";
import { sendMail } from "./utils/emailUtil";
import mongoose from "mongoose";
import {
  MONGODB_CONNECTION_STRING,
  PORT,
  REDIS_URI,
} from "./constants";

const expiredSubs = async () => {
  const doc = await Tenant.find({});
  for (let i = 0; i < doc.length; i++) {
    const date1 = doc[i].packageStartDate;
    const date2 = new Date(Date.now());
    const oneDay = 1000 * 60 * 60 * 24;
    const diffInTime = date2.getTime() - date1.getTime();
    const diffInDays = Math.round(diffInTime / oneDay);
    if (diffInDays <= 30 && diffInDays >= 23) {
      if (30 - diffInDays == 7 || 30 - diffInDays == 3) {
        await sendMail(
          doc[i].email,
          "Kesowa Infinite Ventures Pvt. Ltd",
          "",
          `               
                        <p>Your subscription is expiring in ${30 - diffInDays
          } days.</b>
                        <p>Best regards,</p>
                        <p><b>Team Kesowa</b></p>
                        `,
          ""
        );
      }
    } else if (diffInDays > 30 && diffInDays <= 45 && doc[i].isActive) {
      if (45 - diffInDays == 7 || 45 - diffInDays == 0) {
        await sendMail(
          doc[i].email,
          "Kesowa Infinite Ventures Pvt. Ltd",
          "",
          `               
                    <p>Your subscription has expired.</b>
                    <p>Please upgrade your subscription, Your data will be removed after 15 days of expiry.</b>
                    <p>Best regards,</p>
                    <p><b>Team Kesowa</b></p>
                `,
          ""
        );
      }
    } else {
      doc[i].isActive = false;
      // Logic to purge the tenant data
    }
  }
};

const worker = async () => {
  await mongoose.connect(MONGODB_CONNECTION_STRING);
  //create http server
  const server = http.createServer(
    {
      requestTimeout: 0,
      connectionsCheckingInterval: 60 * 60 * 1e3,
    },
    app
  );

  //create socket server
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: false,
    },
  });

  const pubClient = createClient({ url: REDIS_URI });
  const subClient = pubClient.duplicate();
  await Promise.all([pubClient.connect(), subClient.connect()]);
  io.adapter(createAdapter(pubClient, subClient));
  //handle socket.io
  ioHandler(io);

  server.listen(PORT, () => logger.info(`server listening on port ${PORT}`));
};
worker()
  .then(() => logger.info("Server started"))
  .catch((err) => logger.error(err, "Failed to start server"));

cron.schedule(`00 00 ${Math.floor(Math.random()*10)} * *`, () => {
  expiredSubs()
    .then(() => logger.info("Expired account check ran successfully"))
    .catch((err) => logger.error("Failed to run expired account check", err));
});
