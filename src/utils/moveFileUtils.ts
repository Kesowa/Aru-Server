import { copyFile } from "./dataUtils";

export const copyFiled = async (file1: string, file2: string) => {
  await copyFile(file1, file2);
};
