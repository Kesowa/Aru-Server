import sharp from "sharp";
import fs from "fs/promises";
import { KeyPath, Directory, DocPath, absPath, docPath } from "./pathUtils";
import path from "path";
import exifr from "exifr";
import { exec } from "child_process";
import { promisify } from "util";
const asyncExec = promisify(exec);

/**
 * Input image buffer and filename|desired format, output two buffers with different resolutions
 */
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

/**
 * Input non-absolute path to image, generate 1x and 2x variants in the same directory
 */
export const saveThumbnails = async (img: KeyPath | DocPath) => {
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
  return {
    ...paths,
    size:
      (imgData.byteLength + small.byteLength + medium.byteLength) /
      (1024 * 1024),
  };
};

/**
 * Returns path to thermal raw data file if it exists, or undefined
 */
export const saveThermal = async (img: KeyPath | DocPath) => {
  const thermalPath = docPath(Directory.AI_ML, path.parse(img).name + ".raw");
  const absThermalPath = absPath(Directory.ROOT, img);
  const command =
    "dji_irp -s " +
    absThermalPath +
    " -a measure --measurefmt float32 -o " +
    absPath(Directory.ROOT, thermalPath);
  try {
    await asyncExec(command);
    return {
      thermalPath,
      size: (await fs.stat(absThermalPath)).size / (1024 * 1024),
    };
  } catch (error) {
    return undefined;
  }
};

/**
 * Takes image path or buffer, returns coordinates. Default {lat: 0, lng: 0}
 */
export const readCoords = async (img: KeyPath | DocPath | Buffer) => {
  let metadata: any;

  if (typeof img == "string") {
    const absImgPath = absPath(Directory.ROOT, img);
    metadata = await exifr.parse(absImgPath);
  } else {
    metadata = await exifr.parse(img);
  }
  return {
    lat: metadata.latitude ?? 0,
    lng: metadata.longitude ?? 0,
  };
};
