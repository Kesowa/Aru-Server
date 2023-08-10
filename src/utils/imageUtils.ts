import sharp from "sharp";
import fs from "fs/promises";
import { DirPath, Directory, DocPath, absPath } from "./pathUtils";
import path from "path";

export const createThumbnails = async (img: Buffer) => {
  const sharper = sharp(img);
  const { orientation } = await sharper.metadata();
  return {
    small: await sharper
      .resize(120, 120, { fit: "cover" })
      .jpeg({ quality: 80 })
      .withMetadata({ orientation })
      .toBuffer(),
    medium: await sharper
      .resize(1280, 720, { fit: "inside" })
      .jpeg({ quality: 80 })
      .withMetadata({ orientation })
      .toBuffer(),
  };
};

export const saveThumbnails = async (img: DirPath | DocPath) => {
  const imgPath = absPath(Directory.ROOT, img);
  const imgData = await fs.readFile(imgPath);
  const { small, medium } = await createThumbnails(imgData);
  const pathData = path.parse(imgPath);
  const paths: { small: DocPath; medium: DocPath } = {
    small: path.join("/", pathData.dir, "1x_" + pathData.name + ".jpg"),
    medium: path.join("/", pathData.dir, "2x_" + pathData.name + ".jpg"),
  };
  await Promise.all([
    fs.writeFile(absPath(Directory.ROOT, paths.small), small),
    fs.writeFile(absPath(Directory.ROOT, paths.medium), medium),
  ]);
  return paths;
};
