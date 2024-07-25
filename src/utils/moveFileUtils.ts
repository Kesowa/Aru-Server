import { copyFile } from "./dataUtils";
import { deletePublicFileUsingPath } from "./fileDeleteUtils";

export const copyFiled = async (file1: string, file2: string) => {
  await copyFile(file1, file2);
};

export const renameFile = async (oldFile: string, newFile: string) => {
  await copyFile(oldFile, newFile);
  await deletePublicFileUsingPath(oldFile);
};
