import { createServer } from "node:http";

import { connect } from "amqplib";
import { Server } from "socket.io";

import app, { logger, LoggerMiddleware, SessionMiddleware } from "./app";
import {
  DB_CONNECTION_STRING,
  PORT,
  PUBLIC_SERVER,
  RABBITMQ_CONNECTION_STRING,
} from "./constants";
import { ioHandler } from "./socket";
import { Setup as ZipSetup } from "./utils/cesium";
import { Setup as InferSetup } from "./utils/inferUtils";
import { Setup as ReportSetup } from "./utils/reportUtils";
import { createAdapter } from "./utils/socket.io-adapter";
import { Setup as VodSetup } from "./utils/videoUtils";
import Sequelize from "@sequelize/core";
import { PostgresDialect } from "@sequelize/postgres";
import Mission from "./models/mission";

const worker = async () => {
  logger.info("Connecting to mongodb");
  const sequelize = new Sequelize({
    dialect: PostgresDialect,
    url: DB_CONNECTION_STRING,
    // clientMinMessages: "notice",
    models: [Mission]
  });

  const sessionMiddleware = SessionMiddleware(mongodb.connection);
  const loggerMiddleware = LoggerMiddleware();

  logger.info("Creating http server");
  //create http server
  const server = createServer(app(sessionMiddleware, loggerMiddleware));

  //create socket server
  const io = new Server(server, {
    cors: {
      origin: PUBLIC_SERVER,
      methods: ["GET", "POST"],
      credentials: true,
    },
    cookie: true,
  });

  io.engine.use(sessionMiddleware);
  io.engine.use((req, res, next) => {
    const session = req["session"];
    if (session?.user) {
      logger.info(session.user, "socket.io user authenticated");
      next();
    } else {
      logger.error("socket.io user invalid");
      next(new Error("socket.io user invalid"))
    }
  });

  logger.info("Connecting to rabbitmq");
  const amqpConnection = await connect(RABBITMQ_CONNECTION_STRING);

  // VOD Microservice
  await VodSetup(amqpConnection);

  // ZIP Microservice
  await ZipSetup(amqpConnection);

  // Inference Microservice
  await InferSetup(amqpConnection);

  // Report Microservice
  await ReportSetup(amqpConnection);

  io.adapter(createAdapter({ amqpConnection: () => amqpConnection }));

  //handle socket.io
  ioHandler(io);

  logger.info("Starting server");
  server.listen(PORT, () => logger.info(`server listening on port ${PORT}`));
};
worker()
  .then(() => logger.info("Server started"))
  .catch((err) => logger.error(err, "Failed to start server"));
