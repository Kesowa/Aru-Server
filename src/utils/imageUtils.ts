import sharp from "sharp";
import fs from "fs/promises";

export const createThumbnails = async (img: Buffer) => {
  const sharper = sharp(img);
  const { orientation } = await sharper.metadata();
  return {
    small: sharper
      .resize(120, 120, { fit: "cover" })
      .jpeg({ quality: 80 })
      .withMetadata({ orientation })
      .toBuffer(),
    medium: sharper
      .resize(1280, 720, { fit: "inside" })
      .jpeg({ quality: 80 })
      .withMetadata({ orientation })
      .toBuffer(),
  };
};

export const saveThumbnails = async (img: string) => {
  const imgData = await fs.readFile();
};
