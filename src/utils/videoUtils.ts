import { EventEmitter } from "events";
import { exec } from "child_process";
import fs from "fs";
export const VODEvents = new EventEmitter();
import * as pathUtils from "./pathUtils";
import { promisify } from "util";
import path from "path";
import DJISRTParser from "dji_srt_parser";
const asyncExec = promisify(exec);
const matchExt = /\.\w+$/;

/**
 * Supply mp4/flv video path, generate HLS files, thumbnail, and flv file. Also returns size of all files.
 * DELETES VOD AFTER CONVERSION!!!
 * */
export const transcodeVideo = async (
  filePath: pathUtils.KeyPath | pathUtils.DocPath
) => {
  const doc = pathUtils.docPath(pathUtils.Directory.ROOT, filePath);
  const docPath = pathUtils.docPath(
    pathUtils.Directory.VOD,
    path.basename(filePath)
  );
  const paths = {
    hlsPath: docPath.replace(matchExt, ".m3u8"),
    thumbnailPath: docPath.replace(matchExt, ".jpg"),
    flvPath: docPath.replace(matchExt, ".flv"),
  };

  const absFilePath = pathUtils.absPath(pathUtils.Directory.ROOT, doc);
  const command =
    "/bin/ffmpeg -i " +
    absFilePath +
    " -c:v libx264 -b:v 2500k -g 30 -r 30 -s 1280x720 -preset fast -profile:v baseline -hls_list_size 0 -f hls " +
    pathUtils.absPath(pathUtils.Directory.ROOT, paths.hlsPath) +
    " -ss 00:00:05.000 -vframes 1 " +
    pathUtils.absPath(pathUtils.Directory.ROOT, paths.thumbnailPath) +
    " " +
    pathUtils.absPath(pathUtils.Directory.ROOT, paths.flvPath);

  await asyncExec(command);
  await fs.promises.rm(absFilePath);
  const totalSize = await getVodSize(paths.flvPath);
  return { ...paths, size: totalSize };
};

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
  const index = await fs.promises.readFile(indexPath, "utf8");
  const dir = path.dirname(index);
  const vodFiles = index
    .split("\n")
    .filter((line) => !line.startsWith("#") && line.endsWith(".ts"));
  const partSize = (
    await fs.promises.stat(
      path.join(dir, vodFiles[Math.floor(vodFiles.length / 2)])
    )
  ).size;
  const hlsSize = index.length + vodFiles.length * partSize;
  return hlsSize;
};

/**
 * Takes non-abs path to video file (hls, flv, mp4, etc), returns approx size of all video files in MegaBytes
 */
export const getVodSize = async (
  vodFile: pathUtils.KeyPath | pathUtils.DocPath
) => {
  const absVodPath = pathUtils
    .absPath(pathUtils.Directory.ROOT, vodFile)
    .replace(matchExt, "");
  const absFlvPath = absVodPath + ".flv";
  const absMp4Path = absVodPath + ".mp4";
  const absHlsPath = absVodPath + ".m3u8";
  const absThumbPath = absVodPath + ".jpg";

  const getSize = async (filePath: string) => {
    return (await fs.promises.stat(filePath)).size;
  };

  const getAllSizes = [
    getSize(absFlvPath),
    getSize(absMp4Path),
    getSize(absThumbPath),
    getHlsSize(absHlsPath),
  ];

  const allSizes = await Promise.allSettled(getAllSizes);
  const totalSize = allSizes
    .map((val) => (val.status === "fulfilled" ? val.value : 0))
    .reduce((prevVal, currVal) => prevVal + currVal);
  return totalSize / (1024 * 1024);
};

/**
 * Takes absolute path to HLS index.m3u8 file, and completely erases entire HLS stream
 */
const deleteHls = async (indexPath: string) => {
  const index = await fs.promises.readFile(indexPath, "utf8");
  const dir = path.dirname(indexPath);
  const vodFiles = index
    .split("\n")
    .filter((line) => !line.startsWith("#") && line.endsWith(".ts"));
  vodFiles.push(path.basename(indexPath));
  await Promise.allSettled(
    vodFiles
      .map((filename) => path.join(dir, filename))
      .map((filepath) => fs.promises.rm(filepath))
  );
};

/**
 * Takes non-abs path to video file (hls, flv, mp4, etc), and completely erases it
 */
export const deleteVideo = async (
  vodFile: pathUtils.KeyPath | pathUtils.DocPath
) => {
  const absVodPath = pathUtils
    .absPath(pathUtils.Directory.ROOT, vodFile)
    .replace(matchExt, "");
  const absFlvPath = absVodPath + ".flv";
  const absMp4Path = absVodPath + ".mp4";
  const absHlsPath = absVodPath + ".m3u8";
  const absThumbPath = absVodPath + ".jpg";
  const absGeojsonPath = absVodPath + ".geojson";
  await Promise.allSettled([
    fs.promises.rm(absFlvPath),
    fs.promises.rm(absMp4Path),
    fs.promises.rm(absThumbPath),
    fs.promises.rm(absGeojsonPath),
    deleteHls(absHlsPath),
  ]);
};
