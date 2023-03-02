import fs from "fs";
import { Directory, DirPath } from "../constants";

export const copyFiled = async (file1: string, file2: string) => {
  const currentPath = DirPath(Directory.DEFAULT, file1);
  const destinationPath = DirPath(Directory.DEFAULT, file2);
  await fs.promises.copyFile(currentPath, destinationPath);
};
