import multer from "multer";
import path from "path";
import { Directory, DirPath } from "../constants";
import { Request } from "express";
import { randomUUID } from "crypto";
export const multerStorage = (
  dir: Directory | ((req: Request) => Directory)
) => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const directory = typeof dir === "function" ? dir(req) : dir;
      const absPath = DirPath(directory); // no need to add filename here as it is already handled below
      cb(null, absPath);
    },
    filename: (req, file, cb) => {
      const ext = path.parse(file.originalname).ext;
      cb(null, randomUUID() + ext);
    },
  });
};
