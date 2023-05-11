import fs, { Dir } from "fs";
import path from "path";
import { Directory, DirPath, PUBLIC_DIR } from "../constants";
import s3fs from "../s3utils/lib-aws"

export const deleteDirFileUsingName = async (
  directory: Directory,
  fileName: string
) => {
  try {
    // await fs.promises.unlink(DirPath(directory, fileName));

    await s3fs.rm(DirPath(directory, fileName))

    return true;
  } catch (error) {
    return false;
  }
};

export const deletePublicFileUsingPath = async (filePath: string) => {
  try {
    // await fs.promises.unlink(path.join(PUBLIC_DIR, filePath));

    filePath = filePath.slice(1)

    await s3fs.rm(filePath)
    return true;
  } catch (error) {
    return false;
  }
};

export const deletePublicFolderUsingPath = async (folderName: string) => {
  try {
    if (
      folderName == "" ||
      folderName == "/" ||
      folderName in Object.values(Directory)
    )
      return false;
    await fs.promises.rm(path.join(PUBLIC_DIR, folderName), {
      recursive: true,
    });
  } catch (error) {
    return false;
  }
};

export const deleteDirFolderUsingName = async (
  directory: Directory,
  folderName: string
) => {
  try {
    if (folderName == "" || folderName == "/") return false;
    await fs.promises.rm(DirPath(directory, folderName), { recursive: true });
  } catch (error) {
    return false;
  }
};

export const deleteHlsVodUsingIndex = async (indexFile: string) => {
  const indexPath = DirPath(Directory.VOD, indexFile);
  // const index = await fs.promises.readFile(indexPath, "utf8");
  const bufferData = await s3fs.readFile(indexPath)

  const index = bufferData.toString();

  const vodFiles = index
    .split("\n")
    .filter((line) => !line.startsWith("#") && line.endsWith(".ts"));
  vodFiles.push(indexFile);

  const result = await Promise.allSettled(
    vodFiles.map((file) => deleteDirFileUsingName(Directory.VOD, file))
  );
  return result.every((res) => res);
};
