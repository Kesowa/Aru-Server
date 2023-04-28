import Tenant from "../models/tenant";
import { NextFunction, Request } from "express";
import { AuthResponse } from "./interfaceUtils";
import fs from "fs";
import { IPackage } from "../schemas/package";
import s3fs from "../s3utils/lib-aws";

export const isSize = async (
  req: Request,
  res: AuthResponse,
  next: NextFunction
) => {
  try {
    if (!req.file) {
      return next();
    }
    const file = req.file;
    const docCount = await Tenant.findOne({ _id: res.locals.user.tenantId })
      .populate<{ activePackage: IPackage }>("activePackage")
      .lean();
    const uploadImgSize: number = Number(
      (Number(file.size) / (1024 * 1024)).toFixed(5)
    );
    console.log("file name", file.filename);
    console.log("file size", uploadImgSize);
    console.log("file path", file.path);
    // console.log(docCount);
    const totalImgSize: number = uploadImgSize + Number(docCount.actualSize);
    console.log("total size,", totalImgSize);
    if (totalImgSize < Number(docCount.activePackage.storage)) {
      console.log("user has enough space");
      return next();
    } else {
      console.log("trying to delete file", file.filename);
      await s3fs.rm(file.path);
      return res.status(403).json({
        status: false,
        message: "Actual storage exceeded the Limit of Set storage!",
      });
    }
  } catch (error) {
    req.log.error(error, "error in sizePermission");
    res.status(500).json({
      status: false,
      message: "Server Error!",
    });
  }
};

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

export const isSizeForMultiple = async (
  req: Request,
  res: AuthResponse,
  next: NextFunction
) => {
  try {
    const files = req.files as Express.Multer.File[];
    const docCount = await Tenant.findOne({
      _id: res.locals.user.tenantId,
    })
      .populate<{ activePackage: IPackage }>("activePackage")
      .lean();
    let totalImgSize: number = 0;
    for (let i = 0; i < files.length; i++) {
      const uploadImgSize: number = Number(
        (Number(files[i].size) / (1024 * 1024)).toFixed(5)
      );
      totalImgSize = uploadImgSize + Number(docCount.actualSize);
    }
    if (totalImgSize < Number(docCount.activePackage.storage)) return next();
    else {
      if (Array.isArray(files))
        await Promise.all(files.map((file) => fs.promises.rm(file.path)));
      res.status(403).json({
        status: false,
        message: "Actual storage exceeded the Limit of Set storage!",
      });
    }
  } catch (error) {
    res.locals.logger.error(error);
    res.status(500).json({
      status: false,
      message: "Server Error!",
    });
  }
};
