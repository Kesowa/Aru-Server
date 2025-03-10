import path from "path";
import { EventEmitter } from "stream";

import { Connection } from "amqplib";

import { deletePublicFolderUsingPath } from "./fileDeleteUtils";
import * as pathUtils from "./pathUtils";
import { logger } from "../app";
import layer from "../models/layer";
import { ILayer } from "../schemas/layer";
import { missionSpecificSocket } from "../socket";


export const LayerEvents = new EventEmitter();

export const REQ_QUEUE = "file.decompress.req";
export const RES_QUEUE = "file.decompress.res";

export async function Setup(conn: Connection) {
  const reqChannel = await conn.createChannel();
  await reqChannel.assertQueue(REQ_QUEUE, { durable: true });
  const resChannel = await conn.createChannel();
  await resChannel.assertQueue(RES_QUEUE, { durable: true });
  LayerEvents.on(REQ_QUEUE, function (req) {
    reqChannel.sendToQueue(REQ_QUEUE, Buffer.from(JSON.stringify(req)), {
      persistent: true,
      contentType: "application/json",
    });
  });
  resChannel.consume(RES_QUEUE, function (msg) {
    resChannel.ack(msg);
    LayerEvents.emit(RES_QUEUE, JSON.parse(msg.content.toString()));
  });
}

export type ProcessZipData = ILayer;

export type Zip = {
  zip: string | null;
};

export type AruMetadata = {
  mission_id: string;
  user_id: string;
  tenant_id: string;
  layer_id: string;
};

export type TranscodeRequest = {
  file: string;
  metadata: AruMetadata;
};

export type TranscodeResponse = {
  metadata: AruMetadata;
  zip: Zip;
  success: boolean;
};

export const decompressZip = async (
  filePath: pathUtils.KeyPath | pathUtils.DocPath,
  metadata: AruMetadata
) => {
  const req: TranscodeRequest = {
    file: pathUtils.keyPath(filePath),
    metadata,
  };
  logger.info(req, "SENT ZIP DECOMPRESS REQUEST");
  LayerEvents.emit(REQ_QUEUE, req);
};

export const receiveZip = async (
  zip: Zip,
  metadata: AruMetadata,
  success: boolean
) => {
  const data = await layer.findOne({
    _id: metadata.layer_id,
    tenantId: metadata.tenant_id,
  });
  if (success) {
    data.metadata = "/" + zip.zip + "/tileset.json";
    await data.save();
    missionSpecificSocket
      .to(String(data.missionId))
      .emit("PROCESS_ZIP_FINISHED", data);
  } else {
    missionSpecificSocket
      .to(String(data.missionId))
      .emit("PROCESS_ZIP_FAILED", data);
  }
};

LayerEvents.on(RES_QUEUE, function (res: TranscodeResponse) {
  logger.info(res, "RECEIVED ZIP DECOMPRESS RESPONSE");
  receiveZip(res.zip, res.metadata, res.success)
    .then(() => logger.info(res, "SAVED ZIP"))
    .catch((err) => logger.error({ res, err }, "FAILED TO SAVE ZIP"));
});

export async function delete3DTiles(tilesetJson: string) {
  // check if it is really a tilesetJson string
  logger.info(tilesetJson, "TILESETJSON");
  const decomposePath = path.parse(tilesetJson);
  const docDir = decomposePath.dir;
  const filename = decomposePath.base;
  if (filename == "tileset.json") {
    // delete the directory containing 3D tiles
    return await deletePublicFolderUsingPath(docDir);
  }
  return false;
}
