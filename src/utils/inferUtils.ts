import * as pathUtils from "./pathUtils";
import { EventEmitter } from "stream";
import { logger } from "../app";
import { missionSpecificSocket } from "../socket";
import { Connection } from "amqplib";
import aimlModel from "../models/aimlTask";
import { IAimlTask, inferTypes } from "../schemas/aimlTask";
import { permPath } from "./dataUtils";

export const InferEvents = new EventEmitter();

export const REQ_QUEUE = "file.infer.req";
export const RES_QUEUE = "file.infer.res";

export async function Setup(conn: Connection) {
  const reqChannel = await conn.createChannel();
  await reqChannel.assertQueue(REQ_QUEUE, { durable: true });
  const resChannel = await conn.createChannel();
  await resChannel.assertQueue(RES_QUEUE, { durable: true });
  InferEvents.on(REQ_QUEUE, function (req) {
    reqChannel.sendToQueue(REQ_QUEUE, Buffer.from(JSON.stringify(req)), {
      persistent: true,
      contentType: "application/json",
    });
  });
  resChannel.consume(RES_QUEUE, function (msg) {
    resChannel.ack(msg);
    InferEvents.emit(RES_QUEUE, JSON.parse(msg.content.toString()));
  });
}

export type ProcessInferData = IAimlTask;

export type Infer = string;

export type AruMetadata = {
  mission_id: string;
  user_id: string;
  tenant_id: string;
  infer_id: string;
};

export type InferRequest = {
  file: string;
  infer: inferTypes;
  metadata: AruMetadata;
};

export type InferResponse = {
  metadata: AruMetadata;
  inference: Infer;
  success: boolean;
};

export const sendInfer = async (
  filePath: pathUtils.KeyPath | pathUtils.DocPath,
  infer: inferTypes,
  metadata: AruMetadata
) => {
  const req: InferRequest = {
    file: pathUtils.keyPath(filePath),
    infer,
    metadata,
  };
  logger.info(req, "SENT INFERENCE REQUEST");
  InferEvents.emit(REQ_QUEUE, req);
};

export const receiveInfer = async (
  infer: Infer,
  metadata: AruMetadata,
  success: boolean
) => {
  const data = await aimlModel.findOne({
    _id: metadata.infer_id,
    tenantId: metadata.tenant_id,
  });
  if (success) {
    if (infer) {
      const file_path = await permPath(pathUtils.Directory.AI_ML, infer);
      data.data = file_path;
    } else {
      logger.error(metadata, "No data for inference!");
    }
    data.status = "completed";
    await data.save();
    missionSpecificSocket.to(String(metadata.mission_id)).emit("AI_TASK", data);
  } else {
    data.status = "failed";
    await data.save();
    missionSpecificSocket.to(String(metadata.mission_id)).emit("AI_TASK", data);
  }
};

InferEvents.on(RES_QUEUE, function (res: InferResponse) {
  logger.info(res, "RECEIVED ZIP DECOMPRESS RESPONSE");
  receiveInfer(res.inference, res.metadata, res.success)
    .then(() => logger.info(res, "SAVED INFERENCE"))
    .catch((err) => logger.error({ res, err }, "FAILED TO SAVE INFERENCE"));
});
