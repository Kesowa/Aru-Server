import fs from "fs";

export const isSizeVector = async (
  size: number,
  docCount: any,
  pathh: string
) => {
  try {
    const totalImgSize: number = size + Number(docCount.actualSize);
    if (totalImgSize < Number(docCount.activePackage.storage)) return true;
    else {
      await fs.promises.unlink(String(pathh));
      return false;
    }
  } catch (error) {
    return error;
  }
};
