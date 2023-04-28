import { Directory } from "../constants";
import { Request } from "express";
import s3multer from "../s3utils/multer";

export const multerStorage = (
  dir: Directory | ((req: Request) => Directory),
  tempCopy: boolean = false
) => {
  return new s3multer({ destination: dir, tempCopy });
};
