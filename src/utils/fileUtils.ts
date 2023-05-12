import fs from "fs";
import s3fs from "../s3utils/lib-aws";

export const getFileSize = async (filepath: string) => {
  const fileStats = await s3fs.stat(filepath);
  const fileSize: number = Number(
    (Number(fileStats.size) / (1024 * 1024)).toFixed(5)
  );
  return fileSize;
};

export const checkFileExists = async (filepath: string) => {
  try {
    await s3fs.stat(filepath);
    return true;
  } catch (error) {
    return false;
  }
};

export const findHlsSize = async (indexPath: string, folderPath: string) => {
  const index = await fs.promises.readFile(indexPath, "utf8");
  const vodFiles = index
    .split("\n")
    .filter((line) => !line.startsWith("#") && line.endsWith(".ts"));
  const partSize = (
    await fs.promises.stat(
      folderPath + vodFiles[Math.floor(vodFiles.length / 2)]
    )
  ).size;
  const hlsSize = index.length + vodFiles.length * partSize;
  return hlsSize / (1024 * 1024);
};
