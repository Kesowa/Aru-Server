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
import { deleteObj, readToString, stat, uploadString } from "./objectStorage";
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


export const receiveVideo = async (video: Video, metadata: AruMetadata, success: boolean) => {
  const vod = await VOD.findOne({
    _id: metadata.video_id,
    tenantId: metadata.tenant_id,
  });
  if (success) {
    vod.videoPath = video.hls;
    vod.thumbnail = video.thumb;
    const size = await getHlsSize(video.hls);
    vod.fileSize += size;
    if (video.srt)
      vod.isSRT = await extractTelemetry(video.srt);
    await vod.save();
    missionSpecificSocket
      .to(String(vod.missionID))
      .emit("PROCESS_VIDEO_FINISHED", vod);
  } else {
    vod.videoPath = "/failed.mp4";
    vod.thumbnail = "/failed.png";
    await vod.save();
    missionSpecificSocket
      .to(String(vod.missionID))
      .emit("PROCESS_VIDEO_FAILED", vod);
  };
};

VODEvents.on(RES_QUEUE, function(res: TranscodeResponse) {
  logger.info(res, "RECEIVED VIDEO TRANSCODE RESPONSE");
  receiveVideo(res.video, res.metadata, res.success).
    then(() => logger.info(res, "SAVED VIDEO"))
    .catch((err) => logger.error({ res, err }, "FAILED TO SAVE VIDEO"));
});

/**
 * Supply mp4/flv video path, generate srt and geojson files, and get metadata
 * Returns undefined if no srt found
 */
export const extractTelemetry = async (
  srtPath: pathUtils.KeyPath | pathUtils.DocPath
) => {
  const dir = path.dirname(srtPath);
  const outPath = path.join(dir, "flightpath.geojson");
  const srtData = await readToString(srtPath);
  try {
    const djiData = DJISRTParser(srtData, "flightpath");
    const geojsonData = djiData.toGeoJSON(false, true, false);
    await uploadString(outPath, geojsonData);
  } catch (err) {
    logger.error(err, "failed to extract dji flightpath");
    return false;
  }
  return true;
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
