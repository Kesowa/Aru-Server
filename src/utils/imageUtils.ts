import sharp from "sharp";
import fs from "fs/promises";
import { DirPath, Directory, DocPath, absPath, docPath } from "./pathUtils";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
const asyncExec = promisify(exec);

export const createThumbnails = async (img: Buffer, filename: string) => {
  let format: "jpg" | "png" = "jpg";
  if (path.extname(filename).toLowerCase() === ".png") format = "png";
  const sharper = sharp(img);
  const { orientation } = await sharper.metadata();
  return {
    small: await sharper
      .resize(120, 120, { fit: "cover" })
      .toFormat(format, { quality: 80 })
      .withMetadata({ orientation })
      .toBuffer(),
    medium: await sharper
      .resize(1280, 720, { fit: "inside" })
      .toFormat(format, { quality: 80 })
      .withMetadata({ orientation })
      .toBuffer(),
  };
};

export const saveThumbnails = async (img: DirPath | DocPath) => {
  const imgPath = absPath(Directory.ROOT, img);
  const imgData = await fs.readFile(imgPath);
  const { small, medium } = await createThumbnails(imgData, img);
  const pathData = path.parse(img);
  const paths: { small: DocPath; medium: DocPath } = {
    small: path.join("/", pathData.dir, "1x_" + pathData.base),
    medium: path.join("/", pathData.dir, "2x_" + pathData.base),
  };
  await Promise.all([
    fs.writeFile(absPath(Directory.ROOT, paths.small), small),
    fs.writeFile(absPath(Directory.ROOT, paths.medium), medium),
  ]);
  return paths;
};

/**
 * Returns path to thermal raw data file if it exists, or undefined
 */
export const saveThermal = async (img: DirPath | DocPath) => {
  const thermalPath = docPath(Directory.AI_ML, path.parse(img).name + ".raw");
  const command = "dji_irp -s " + absPath(Directory.ROOT, img) + " -a measure --measurefmt float32 -o " + absPath(Directory.ROOT, thermalPath);
  try {
    await asyncExec(command);
    return thermalPath
  }
  catch (error) {
    return undefined
  }
}
