import { exec } from "child_process";
import { randomUUID } from "crypto";
import path from "path";
import { promisify } from "util";

import exifr from "exifr";
import sharp from "sharp";

import { deletePublicFileUsingPath } from "./fileDeleteUtils";
import {
  downloadTemp,
  readToBuffer,
  stat,
  uploadAnything,
  uploadFile,
} from "./objectStorage";
import { KeyPath, Directory, DocPath, docPath } from "./pathUtils";
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
  const imgData = await readToBuffer(img);
  const { small, medium } = await createThumbnails(imgData, img);
  const pathData = path.parse(img);
  const paths: { small: DocPath; medium: DocPath } = {
    small: path.join(pathData.dir, "1x_" + pathData.base),
    medium: path.join(pathData.dir, "2x_" + pathData.base),
  };
  await Promise.all([
    uploadAnything(paths.small, small),
    uploadAnything(paths.medium, medium),
  ]);
  return {
    ...paths,
    size: (small.byteLength + medium.byteLength) / (1024 * 1024),
  };
};

export const deleteThumbnails = async (img: KeyPath | DocPath) => {
  const pathData = path.parse(img);
  const paths: { small: DocPath; medium: DocPath } = {
    small: path.join(pathData.dir, "1x_" + pathData.base),
    medium: path.join(pathData.dir, "2x_" + pathData.base),
  };
  await Promise.all([
    deletePublicFileUsingPath(paths.small),
    deletePublicFileUsingPath(paths.medium),
  ]);
};

/**
 * Returns path to thermal raw data file if it exists, or undefined
 */
export const saveThermal = async (img: KeyPath | DocPath) => {
  const tmpThermalImg = await downloadTemp(img);
  const tmpThermalPath = "/tmp/" + randomUUID() + ".raw";
  const command =
    "dji_irp -s " +
    tmpThermalImg +
    " -a measure --measurefmt float32 -o " +
    tmpThermalPath;
  await asyncExec(command);
  const thermalPath = docPath(Directory.AI_ML, randomUUID() + ".raw");
  await uploadFile(tmpThermalPath, thermalPath);
  const { size } = await stat(thermalPath);
  return {
    thermalPath,
    size: size / (1024 * 1024),
  };
};

/**
 * Takes image path or buffer, returns coordinates. Default {lat: 0, lng: 0}
 */
export const readCoords = async (img: KeyPath | DocPath | Buffer) => {
  let metadata: any;

  if (typeof img == "string") {
    const imgBuf = await readToBuffer(img);
    metadata = await exifr.parse(imgBuf);
  } else {
    metadata = await exifr.parse(img);
  }
  return {
    lat: metadata?.latitude ?? 0,
    lng: metadata?.longitude ?? 0,
  };
};
