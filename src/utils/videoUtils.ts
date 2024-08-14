import { EventEmitter } from "events";
import { exec } from "child_process";
import fs from "fs";
export const VODEvents = new EventEmitter();
import * as pathUtils from "./pathUtils";
import { promisify } from "util";
import path from "path";
import DJISRTParser from "dji_srt_parser";
import { logger } from "../app";
import VOD from "../models/vod";
import { missionSpecificSocket } from "../socket";
import { deleteObj, readToString, stat } from "./objectStorage";
const asyncExec = promisify(exec);
const matchExt = /\.\w+$/;

export const REQ_QUEUE = "vod.transcode.req";
export const RES_QUEUE = "vod.transcode.res";

export type Video = {
  srt: string | null,
  hls: string | null,
  thumb: string | null,
}

export type AruMetadata = {
  location_id: string | null,
  mission_id: string,
  flight_id: string,
  user_id: string,
  tenant_id: string,
  video_id: string,
}

export type TranscodeRequest = {
  file: string,
  metadata: AruMetadata,
}

export type TranscodeResponse = {
  metadata: AruMetadata,
  video: Video,
  success: boolean,
}

/**
 * Supply mp4/flv video path, generate HLS files, thumbnail, and flv file. Also returns size of all files.
 * DELETES VOD AFTER CONVERSION!!!
 * */
export const transcodeVideo = async (
  filePath: pathUtils.KeyPath | pathUtils.DocPath,
  metadata: AruMetadata,
) => {
  const req: TranscodeRequest = {
    file: pathUtils.keyPath(filePath),
    metadata,
  }
  logger.info(req, "SENT VIDEO TRANSCODE REQUEST");
  VODEvents.emit(REQ_QUEUE, req);
};


export const receiveVideo = async (video: Video, metadata: AruMetadata) => {
  const vod = await VOD.findOneAndUpdate({
    _id: metadata.video_id,
    tenantId: metadata.tenant_id,
  }, {
    videoPath: path.join("/", video.hls),
    thumbnail: path.join("/", video.thumb || "/processing.jpg"),
  },
    {
      new: true
    }
  );
  missionSpecificSocket
    .to(String(vod.missionID))
    .emit("PROCESS_VIDEO_FINISHED", vod);
  // done later to prevent it from messing with video
  const size = await getHlsSize(video.hls);
  await vod.update({ $inc: { fileSize: size } });
};

VODEvents.on(RES_QUEUE, function(res: TranscodeResponse) {
  logger.info(res, "RECEIVED VIDEO TRANSCODE RESPONSE");
  receiveVideo(res.video, res.metadata).
    then(() => logger.info(res, "SAVED VIDEO"))
    .catch((err) => logger.error({res, err}, "FAILED TO SAVE VIDEO"));
});

/**
 * Supply mp4/flv video path, generate srt and geojson files, and get metadata
 * Returns undefined if no srt found
 */
export const extractTelemetry = async (
  filePath: pathUtils.KeyPath | pathUtils.DocPath
) => {
  const geojsonPath = pathUtils.docPath(
    pathUtils.Directory.VOD,
    path.basename(filePath).replace(matchExt, ".geojson")
  );
  const srtPath = pathUtils.docPath(
    pathUtils.Directory.VOD,
    path.basename(filePath).replace(matchExt, ".srt")
  );
  const absSrtPath = pathUtils.absPath(pathUtils.Directory.ROOT, srtPath);
  const command =
    "/bin/ffmpeg -i " +
    pathUtils.absPath(pathUtils.Directory.ROOT, filePath) +
    " -map 0:s:0 " +
    absSrtPath;
  try {
    await asyncExec(command);
    const srtData = await fs.promises.readFile(absSrtPath, "utf8");
    const djiData = DJISRTParser(srtData, absSrtPath);
    const geojsonData = djiData.toGeoJSON(false, true, false);
    await fs.promises.writeFile(
      pathUtils.absPath(pathUtils.Directory.ROOT, geojsonPath),
      geojsonData
    );
    const metadata = djiData.metadata();
    await fs.promises.rm(absSrtPath);
    return {
      geojsonPath,
      srtPath,
      metadata,
      geojsonSize: geojsonData.length / (1024 * 1024),
    };
  } catch (error) {
    return undefined;
  }
};

/**
 * Takes absolute path to index.m3u8 file, returns approx size of entire HLS stream in bytes
 */
const getHlsSize = async (indexPath: string) => {
  const index = await readToString(indexPath);
  const dir = path.dirname(indexPath);
  const vodFiles = index
    .split("\n")
    .filter((line) => !line.startsWith("#") && line.endsWith(".ts"));
  const partSize = (
    await stat(
      path.join(dir, vodFiles[Math.floor(vodFiles.length / 2)])
    )
  ).size;
  const hlsSize = index.length + vodFiles.length * partSize;
  return hlsSize;
};

/**
 * Takes absolute path to HLS index.m3u8 file, and completely erases entire HLS stream
 */
export const deleteHlsVodUsingIndex = async (indexFile: string) => {
  const index = await readToString(indexFile);
  const indexDir = path.dirname(indexFile);
  const vodFiles = index
    .split("\n")
    .filter((line) => !line.startsWith("#") && line.endsWith(".ts"))
    .map((file) => indexDir + "/" + file);
  vodFiles.push(indexFile);
  const result = await Promise.allSettled(
    vodFiles.map((file) => deleteObj(file))
  );
  return result.every((res) => res);
};
