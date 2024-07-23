import path from "path";
import { Directory } from "../constants";
import { deleteDir, deleteObj, readToString } from "./objectStorage";
import { docPath } from "./pathUtils";

export const deleteDirFileUsingName = async (dir: Directory, objectkey: string) => {
  await deleteObj(docPath(dir, objectkey));
};

export const deletePublicFileUsingPath = async (filePath: string) => {
  await deleteObj(filePath);
};

export const deletePublicFolderUsingPath = async (folderName: string) => {
  if (
    folderName == "" ||
    folderName == "/" ||
    folderName in Object.values(Directory)
  )
    return false;
  return deleteDir(folderName);
};

export const deleteHlsVodUsingIndex = async (indexFile: string) => {
  const index = await readToString(indexFile);
  const vodFiles = index
    .split("\n")
    .filter((line) => !line.startsWith("#") && line.endsWith(".ts"));
  vodFiles.push(indexFile);
  const indexDir = path.dirname(indexFile);
  const result = await Promise.allSettled(
    vodFiles.map((file) => deleteObj(indexDir + "/" + file))
  );
  return result.every((res) => res);
};
