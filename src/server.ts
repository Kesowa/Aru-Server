import app, { logger } from "./app";
import cron from "node-cron";
import User from "./models/user";
import http from "http";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";
import { ioHandler } from "./socket";
import { deletePublicFileUsingPath } from "./utils/fileDeleteUtils";
import Tenant from "./models/tenant";
import { sendMail } from "./utils/emailUtil";
import mongoose from "mongoose";
import {
  DUMMY_TENANT,
  MONGODB_CONNECTION_STRING,
  PORT,
  REDIS_URI,
} from "./constants";

const tempCleanup = async () => {
  logger.info("Running Cron Job");
  logger.info("Expiry check started for client");
  const doc = await User.find({ userType: "tenant-client" });
  for (let i = 0; i < doc.length; i++) {
    const date1 = doc[i].expiryDatee;
    const date2 = new Date(Date.now());
    const oneDay = 1000 * 60 * 60 * 24;
    const diffInTime = date1.getTime() - date2.getTime();
    const diffInDays = Math.round(diffInTime / oneDay);
    if (diffInDays < 0) {
      await deletePublicFileUsingPath(doc[i].avatar);
      doc[i].userType = "standalone-user";
      doc[i].isActive = false;
      doc[i].tenantId = DUMMY_TENANT;
      await doc[i].save();
    }
  }
};

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
                        <p>Your subscription is expiring in ${
                          30 - diffInDays
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
  const server = http.createServer(app);
  server.requestTimeout = 1000 * 60 * 60 * 2;
  server.headersTimeout = 1000 * 60 * 60 * 2;
  server.keepAliveTimeout = 0;

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

cron.schedule("00 00 * * *", () => {
  tempCleanup()
    .then(() => logger.info("Temp files cleanup successful"))
    .catch((err) => logger.error("Unable to cleanup temp files", err));
});

cron.schedule("00 00 * * *", () => {
  expiredSubs()
    .then(() => logger.info("Expired account check ran successfully"))
    .catch((err) => logger.error("Failed to run expired account check", err));
});
