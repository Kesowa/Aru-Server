import { Directory, DirPath } from "../constants";
import s3fs from "../s3utils/lib-aws";

export const copyFiled = async (file1: string, file2: string) => {
  const currentPath = DirPath(Directory.DEFAULT, file1);
  const destinationPath = DirPath(Directory.DEFAULT, file2);
  await s3fs.copyFile(currentPath, destinationPath);
};
