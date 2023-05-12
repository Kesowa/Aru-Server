import { Directory, DirPath } from "../constants";
import s3fs from "../s3utils/lib-aws";

export const deleteDirFileUsingName = async (
  directory: Directory,
  fileName: string
) => {
  try {
    // await fs.promises.unlink(DirPath(directory, fileName));

    await s3fs.rm(DirPath(directory, fileName));

    return true;
  } catch (error) {
    return false;
  }
};

export const deletePublicFileUsingPath = async (filePath: string) => {
  try {
    // await fs.promises.unlink(path.join(PUBLIC_DIR, filePath));
    await s3fs.rm(DirPath(Directory.DEFAULT, filePath));
    return true;
  } catch (error) {
    return false;
  }
};

export const deleteHlsVodUsingIndex = async (indexFile: string) => {
  const indexPath = DirPath(Directory.VOD, indexFile);
  // const index = await fs.promises.readFile(indexPath, "utf8");
  const bufferData = await s3fs.readFile(indexPath);

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
