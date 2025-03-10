import { EventEmitter } from "stream";

import { Connection } from "amqplib";

import { logger } from "../app";
import { notificationSocket } from "../socket";
import { permPath, saveVectorLayer } from "./dataUtils";
import * as pathUtils from "./pathUtils";
import aimlModel from "../models/aimlTask";
import Layer from "../models/layer";
import { IAimlTask, inferences, inferTypes } from "../schemas/aimlTask";
import { vectorProps } from "../schemas/vectorprops";

export const InferEvents = new EventEmitter();

export const REQ_QUEUE_SFX = ".infer.req";
export const RES_QUEUE_SFX = ".infer.res";

export async function Setup(conn: Connection) {
  for (const queue of inferences) {
    const REQ_QUEUE = queue + REQ_QUEUE_SFX;
    const RES_QUEUE = queue + RES_QUEUE_SFX;
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
    InferEvents.on(RES_QUEUE, function (res: InferResponse | InferProgress) {
      if ((res as InferProgress).progress !== undefined) {
        const progress = res as InferProgress;

        logger.info(progress, "INFERENCE PROGRESS UPDATE");
        notificationSocket
          .to(String(progress.metadata.tenant_id))
          .emit("AI_TASK_PROGRESS", {
            inferId: progress.metadata.infer_id,
            status: progress.status,
            progress: progress.progress,
          });
      } else {
        const response = res as InferResponse;

        logger.info(response, "RECEIVED INFERENCE RESPONSE");
        receiveInfer(
          response.inference,
          queue,
          response.metadata,
          response.success
        )
          .then(() => logger.info(response, "SAVED INFERENCE"))
          .catch((err) =>
            logger.error({ res, err }, "FAILED TO SAVE INFERENCE")
          );
      }
    });
  }
}

export type ProcessInferData = IAimlTask;

export type Inference = string;

export type AruMetadata = {
  mission_id: string;
  user_id: string;
  tenant_id: string;
  infer_id: string;
  doc_id: string;
};

export type InferRequest = {
  file: string;
  infer: inferTypes;
  metadata: AruMetadata;
};

export type InferResponse = {
  metadata: AruMetadata;
  inference: Inference;
  success: boolean;
};

export type InferProgress = {
  metadata: AruMetadata;
  status: string;
  progress: number;
};

export const sendInfer = async (
  filePath: pathUtils.KeyPath | pathUtils.DocPath,
  infer: inferTypes,
  metadata: AruMetadata
) => {
  const REQ_QUEUE = infer + REQ_QUEUE_SFX;
  const req: InferRequest = {
    file: pathUtils.keyPath(filePath),
    infer,
    metadata,
  };
  logger.info(req, "SENT INFERENCE REQUEST");
  InferEvents.emit(REQ_QUEUE, req);
};

export const receiveInfer = async (
  filePath: Inference,
  infer: inferTypes,
  metadata: AruMetadata,
  success: boolean
) => {
  const data = await aimlModel.findOne({
    _id: metadata.infer_id,
    tenantId: metadata.tenant_id,
  });
  if (success) {
    if (filePath) {
      const file_path = await permPath(pathUtils.Directory.AI_ML, filePath);
      data.data = file_path;
    } else {
      logger.error(metadata, "No data for inference!");
    }
    data.status = "completed";
    await data.save();
    notificationSocket.to(String(metadata.tenant_id)).emit("AI_TASK", data);

    switch (infer) {
      case "violence":
        break;
      case "people-count":
        break;
      case "deepforest":
      case "rooftopseg":
        await receiveVectorData(data);
        break;
      case "thermal":
        break;
    }
  } else {
    data.status = "failed";
    await data.save();
    notificationSocket.to(String(metadata.tenant_id)).emit("AI_TASK", data);
  }
};

function inferToVec(infer: inferTypes) {
  switch (infer) {
    case "deepforest":
      return vectorProps.GREEN_VERGE;
    case "thermal":
      return vectorProps.ELECTRIC_TRANSFORMER;
    case "rooftopseg":
      return vectorProps.BUILDING_FOOTPRINT;
  }
}

async function receiveVectorData(task: IAimlTask) {
  const sourceLayer = await Layer.findOne({
    tenantId: task.tenant,
    _id: task.doc,
  });
  const vectorLayer = await saveVectorLayer(task.data as string, {
    color: "#7ed321",
    icon: "MarkerIcon",
  });
  const dataLayer = await new Layer({
    name: sourceLayer.name + `: ${task.infer}`,
    type: "Vector",
    vector: inferToVec(task.infer),
    color: vectorLayer.flagColor,
    layerpath: vectorLayer.geojsonPath,
    fileSize: vectorLayer.size,
    featureCount: vectorLayer.featureCount,
    captureDate: new Date(),
    missionId: sourceLayer.missionId,
    tenantId: sourceLayer.tenantId,
    createdBy: task.createdBy,
    updatedBy: task.updatedBy,
  }).create();
  return dataLayer;
}
