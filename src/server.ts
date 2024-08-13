import app, { logger } from "./app";
import http from "http";
import { Server } from "socket.io";
import { createAdapter } from "./utils/socket.io-adapter";
import { connect } from "amqplib";
import { ioHandler } from "./socket";
import { REQ_QUEUE, RES_QUEUE, VODEvents } from "./utils/videoUtils";

import mongoose from "mongoose";
import {
  MONGODB_CONNECTION_STRING,
  PORT,
  RABBITMQ_CONNECTION_STRING,
} from "./constants";

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
  const amqpConnection = await connect(RABBITMQ_CONNECTION_STRING);
  const reqChannel = await amqpConnection.createChannel();
  await reqChannel.assertQueue(REQ_QUEUE, { durable: true });
  const resChannel = await amqpConnection.createChannel();
  await resChannel.assertQueue(RES_QUEUE, { durable: true });
  VODEvents.on(
    REQ_QUEUE,
    function(req) {
      reqChannel.sendToQueue(
        REQ_QUEUE,
        Buffer.from(JSON.stringify(req)),
        {
          persistent: true,
          contentType: "application/json",
        }
      )
    });
  resChannel.consume(
    RES_QUEUE,
    function(msg) {
      VODEvents.emit(
        RES_QUEUE,
        JSON.parse(msg.content.toString())
      );
    });
  io.adapter(
    createAdapter({ amqpConnection: () => amqpConnection })
  );
  //handle socket.io
  ioHandler(io);

  server.listen(PORT, () => logger.info(`server listening on port ${PORT}`));
};
worker()
  .then(() => logger.info("Server started"))
  .catch((err) => logger.error(err, "Failed to start server"));

