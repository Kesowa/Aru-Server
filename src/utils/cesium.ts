import * as pathUtils from "./pathUtils";
import path from "path";
import unzipper from "unzipper";
import { minioClient, uploadAnything } from "./objectStorage";
import { S3_BUCKET_NAME } from "../constants";
import { EventEmitter, PassThrough } from "stream";
import { deletePublicFolderUsingPath } from "./fileDeleteUtils";
import { logger } from "../app";
import { ILayer } from "../schemas/layer";
import { missionSpecificSocket } from "../socket";
import layer from "../models/layer";

export const LayerEvents = new EventEmitter();
export const REQ_QUEUE = "file.decompress.req";
export const RES_QUEUE = "file.decompress.res";

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
    data.metadata = "/" + zip.zip;
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
  logger.info(res, "RECEIVED VIDEO TRANSCODE RESPONSE");
  receiveZip(res.zip, res.metadata, res.success)
    .then(() => logger.info(res, "SAVED ZIP"))
    .catch((err) => logger.error({ res, err }, "FAILED TO SAVE ZIP"));
});

export async function ZipToTiles3D(zipDoc: string) {
  const name = path.parse(zipDoc).name;
  const docDir = pathUtils.docPath(pathUtils.Directory.CESIUM_3D, name);
  const customSource = {
    stream: function (offset: number, length: number) {
      const pass = new PassThrough();
      minioClient
        .getPartialObject(
          S3_BUCKET_NAME,
          pathUtils.keyPath(zipDoc),
          offset,
          length
        )
        .then((stream) => stream.pipe(pass))
        .catch((err) => pass.destroy(err));
      return pass;
    },
    size: async function () {
      const objMetadata = await minioClient.statObject(
        S3_BUCKET_NAME,
        pathUtils.keyPath(zipDoc)
      );
      return objMetadata.size;
    },
  };

  // @ts-ignore
  const directory = (await unzipper.Open.custom(
    customSource
  )) as unzipper.CentralDirectory;
  if (
    directory.files.findIndex(
      (entry) => entry.type == "File" && entry.path == "tileset.json"
    ) == -1
  ) {
    // tileset.json not found
    return undefined;
  }
  for (let i = 0; i < directory.files.length; i += 10) {
    await Promise.allSettled(
      directory.files
        .slice(i, i + 10)
        .filter((file) => file.type == "File")
        .map(async (file) => {
          await uploadAnything(
            path.join(docDir, file.path),
            await file.buffer()
          );
        })
    );
  }
  return path.join(docDir, "tileset.json");
}

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
