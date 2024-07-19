import * as Minio from "minio";
import { S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY, S3_BUCKET_NAME } from "../constants";
import { buffer } from "stream/consumers";
import { Directory, docPath, keyPath } from "./pathUtils";
import archiver from "archiver";
import { PassThrough } from "stream";
import { randomUUID } from "crypto";

export const minioClient = new Minio.Client({
  endPoint: S3_ENDPOINT,
  port: 9000,
  useSSL: false,
  accessKey: S3_ACCESS_KEY,
  secretKey: S3_SECRET_KEY,
})

export const readToString = async (objKey: string) => {
  const obj = await minioClient.getObject(S3_BUCKET_NAME, keyPath(objKey));
  const buf = await buffer(obj);
  return buf.toString("utf8");
}

export const readToBuffer = async (objKey: string) => {
  const obj = await minioClient.getObject(S3_BUCKET_NAME, keyPath(objKey));
  const buf = await buffer(obj);
  return buf;
}

export const uploadString = async (objKey: string, data: string) => {
  await minioClient.putObject(S3_BUCKET_NAME, keyPath(objKey), data);
}

export const archive = async (objKeys: string[]) => {
  const archive = archiver("zip", {
    zlib: { level: 9 }, // Sets the compression level.
  });
  objKeys.forEach(async objKey => {
    const stream = await minioClient.getObject(S3_BUCKET_NAME, keyPath(objKey));
    archive.append(stream, {
      name: objKey,
    });
  });
  const archivePath = keyPath(docPath(Directory.TEMP, randomUUID() + ".zip"));
  await Promise.all([ 
    await minioClient.putObject(S3_BUCKET_NAME, archivePath, archive),
    await archive.finalize()
  ])
  return archivePath
}
