import Tenant from "../models/tenant";
import { NextFunction, Request } from "express";
import { AuthResponse } from "./interfaceUtils";
import fs from "fs";
import { IPackage } from "../schemas/package";

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
    req.log.info(file.filename, "file name");
    req.log.info(uploadImgSize, "file size");
    req.log.info(file.path, "file path");
    // req.log.info(docCount);
    const totalImgSize: number = uploadImgSize + Number(docCount.actualSize);
    req.log.info(totalImgSize, "total size");
    if (totalImgSize < Number(docCount.activePackage.storage)) {
      req.log.info("user has enough space");
      return next();
    } else {
      req.log.info(file.filename, "trying to delete file");
      await fs.promises.rm(file.path);
      return res.status(403).json({
        status: false,
        message: "Actual storage exceeded the Limit of Set storage!",
      });
    }
  } catch (error) {
    req.log.error(error);
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
