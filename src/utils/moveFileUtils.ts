import fs from "fs";
import { Directory, DirPath } from "../constants";

export const copyFiled = async (file1: string, file2: string) => {
  const currentPath = DirPath(Directory.ROOT, file1);
  const destinationPath = DirPath(Directory.ROOT, file2);
  await fs.promises.copyFile(currentPath, destinationPath);
};

export const renameFile = async (oldFile: string, newFile: string) => {
  await fs.promises.rename(oldFile, newFile);
};
