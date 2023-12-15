import fs from "fs";
import { Logger } from "pino";
import { Directory, DirPath } from "../constants";

export const getFileSize = async (filepath: string) => {
  const fileStats = await fs.promises.stat(filepath);
  const fileSize: number = Number(
    (Number(fileStats.size) / (1024 * 1024)).toFixed(5)
  );
  return fileSize;
};

export const createDirIfNotExists = async (
  filepath: string,
  logger: Logger
) => {
  try {
    await fs.promises.access(filepath);
    logger.info("Directory exists...");
  } catch (error) {
    logger.warn("Directory does not exist... Creating...");
    await fs.promises.mkdir(filepath, { recursive: true });
  }
};

export const createDirFileUsingNameAndData = async (
  directory: Directory,
  fileName: string,
  data: string
) => {
  try {
    await fs.promises.writeFile(DirPath(directory, fileName), data);
    return true;
  } catch (error) {
    return false;
  }
};

export const createDirFileWriteStreamUsingName = (
  directory: Directory,
  fileName: string
) => {
  return fs.createWriteStream(DirPath(directory, fileName));
};

export const checkFileExists = async (filepath: string) => {
  try {
    await fs.promises.stat(filepath);
    return true;
  } catch (error) {
    return false;
  }
};

export const findHlsSize = async (indexFile: string) => {
  const indexPath = DirPath(Directory.VOD, indexFile);
  const index = await fs.promises.readFile(indexPath, "utf8");
  const vodFiles = index
    .split("\n")
    .filter((line) => !line.startsWith("#") && line.endsWith(".ts"));
  const partSize = (
    await fs.promises.stat(
      DirPath(Directory.VOD, vodFiles[Math.floor(vodFiles.length / 2)])
    )
  ).size;
  const hlsSize = index.length + vodFiles.length * partSize;
  return hlsSize / (1024 * 1024);
};
