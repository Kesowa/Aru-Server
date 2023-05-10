import { randomUUID } from "crypto";
import { Request } from "express";
import { StorageEngine } from "multer";
import path from "path";
import s3fs from "./lib-aws";
import { PassThrough } from "stream";
import fs from "fs";
import onFinished from "on-finished";
import { Directory } from "../constants";

type Destination = Directory | ((req: Request) => Directory);
export default class CustomStorageEngine implements StorageEngine {
  destination: Destination;
  tempCopy: boolean;
  cleanup: boolean;
  constructor(config: { destination: Destination, tempCopy: boolean, cleanup: boolean }) {
    this.destination = config.destination;
    this.tempCopy = config.tempCopy;
    this.cleanup = config.cleanup;
  }

  _handleFile(
    req: Request,
    file: Express.Multer.File,
    callback: (
      error?: unknown,
      info?: Partial<Express.Multer.File> | undefined
    ) => void
  ): void {
    if (typeof this.destination === "string") {
      file.destination = this.destination;
    } else
      try {
        file.destination = this.destination(req);
      } catch (err) {
        callback(err);
        return;
      }

    file.filename = randomUUID() + path.extname(file.originalname);
    file.path = path.join(file.destination, file.filename);
    const s3stream = file.stream.pipe(new PassThrough())
    if (this.tempCopy) {

      console.log(`Inside temp copy ${this.tempCopy}`)

      const tempPath = "/tmp/" + file.filename;
      console.log(`Temp Path ${tempPath}`)
      file["tempPath"] = tempPath;
      const tempStream = file.stream.pipe(new PassThrough());
      const fileStream = fs.createWriteStream(tempPath);
      tempStream.pipe(fileStream);
      if (this.cleanup) {
        onFinished(req.res, () => {
          fs.rm(tempPath, console.error);
        })
      }

    }
    s3fs
      .writeStream(file.path, s3stream)
      .then(() => s3fs.stat(file.path))
      .then(({ size }) => callback(null, { ...file, size }))
      .catch((err) => callback(err));
  }

  _removeFile(
    _req: Request,
    file: Express.Multer.File,
    callback: (error: Error | null) => void
  ): void {
    s3fs
      .rm(file.path)
      .then(() => callback(null))
      .catch((err) => callback(err as Error));
  }
}
