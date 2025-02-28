import { Directory } from "../constants";
import { deleteDir, deleteObj } from "./objectStorage";
import { docPath } from "./pathUtils";

export const deleteDirFileUsingName = async (
  dir: Directory,
  objectkey: string
) => {
  await deleteObj(docPath(dir, objectkey));
};

export const deletePublicFileUsingPath = async (filePath: string) => {
  await deleteObj(filePath);
};

export const deletePublicFolderUsingPath = async (folderName: string) => {
  if (
    folderName == "" ||
    folderName == "/" ||
    Object.values(Directory).includes(folderName as Directory)
  )
    return false;
  await deleteDir(folderName);
  return true;
};
