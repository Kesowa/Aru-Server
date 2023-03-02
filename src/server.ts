import app from "./app";
import cron from "node-cron";
import User from "./models/user";
import http from "http";
import { Server } from "socket.io";
import cluster, { Worker } from "cluster";
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";
import { ioHandler } from "./socket";

import { deletePublicFileUsingPath } from "./utils/fileDeleteUtils";
import { promises as asyncFS } from "fs";
import path from "path";
import Tenant from "./models/tenant";
import { sendMail } from "./utils/emailUtil";
import mongoose from "mongoose";
import {
  DUMMY_TENANT,
  MONGODB_CONNECTION_STRING,
  PORT,
  PUBLIC_DIR,
  Mode,
  MODE,
  REDIS_URI,
} from "./constants";
import { cpus } from "os";
import { pid } from "process";

// Only run one worker and master in dev
const numCPUs = MODE == Mode.Dev ? 1 : Math.min(cpus().length, 8);

const tempCleanup = async () => {
  console.log("Running Cron Job");
  console.log("Expiry check started for client");
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
  const TMP_IMG = path.join(PUBLIC_DIR, "/images/temp/");
  const files = await asyncFS.readdir(TMP_IMG);
  await Promise.all(files.map((file) => asyncFS.rm(path.join(TMP_IMG, file))));
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

  const port = process.env.port;
  server.listen(port, () =>
    console.log(`worker ${cluster.worker?.id} listening on port ${port}`)
  );
};
type PID = number;
type PORT = number;
if (cluster.isPrimary) {
  const workers: Worker[] = [];
  const ports = new Map<PID, PORT>();
  console.log(`Master ${process.pid} is runnng`);

  for (let i = 0; i < numCPUs; i++) {
    const port = PORT + i;
    const worker = cluster.fork({ port });
    workers[worker.id] = worker;
    ports.set(worker.id, port);
  }

  cluster.on("exit", (worker) => {
    workers[worker.id] = null;
    const port = ports.get(worker.id);
    ports.delete(worker.id);
    console.log(`Worker ${worker.process.pid} died`);
    const newWorker = cluster.fork({ port });
    workers[newWorker.id] = newWorker;
    ports.set(newWorker.id, port);
    console.log(`new worker ${newWorker.id} listening on port ${port}`);
  });
  let clean = true;
  process.on("SIGTERM", function () {
    console.info(`Main process ${pid} exiting!`);
    workers.forEach((worker, id) => {
      if (worker != null) {
        try {
          worker.kill("SIGINT");
        } catch (error) {
          clean = false;
          console.error("failed to kill worker", id, error);
        }
      }
    });
    // httpServer.close((err) => {
    //   clean = false;
    //   console.error("failed to close http server", err);
    // });
    process.exit(clean ? 0 : 1);
  });

  cron.schedule("00 00 * * *", () => {
    tempCleanup()
      .then(() => console.log("Temp files cleanup successful"))
      .catch((err) => console.error("Unable to cleanup temp files", err));
  });

  cron.schedule("00 00 * * *", () => {
    expiredSubs()
      .then(() => console.log("Expired account check ran successfully"))
      .catch((err) =>
        console.error("Failed to run expired account check", err)
      );
  });
} else {
  worker()
    .then(() => console.info("Server started", pid))
    .catch((err) => console.error("Failed to start server", pid, err));
}
