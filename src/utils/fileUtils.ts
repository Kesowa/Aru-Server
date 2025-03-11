import { Directory, DirPath } from "../constants";
import { readToString, stat } from "./objectStorage";

export const getFileSize = async (filepath: string) => {
  const fileStats = await stat(filepath);
  const fileSize: number = Number(
    (Number(fileStats.size) / (1024 * 1024)).toFixed(5),
  );
  return fileSize;
};

export const checkFileExists = async (filepath: string) => {
  try {
    await stat(filepath);
    return true;
  } catch (error) {
    return false;
  }
};

export const findHlsSize = async (indexFile: string) => {
  const index = await readToString(indexFile);
  const vodFiles = index
    .split("\n")
    .filter((line) => !line.startsWith("#") && line.endsWith(".ts"));
  const partSize = (
    await stat(
      DirPath(Directory.VOD, vodFiles[Math.floor(vodFiles.length / 2)]),
    )
  ).size;
  const hlsSize = index.length + vodFiles.length * partSize;
  return hlsSize / (1024 * 1024);
};
