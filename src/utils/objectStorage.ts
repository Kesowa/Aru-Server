import * as Minio from "minio";
import { S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY, S3_BUCKET_NAME } from "../constants";
import { buffer } from "stream/consumers";
import { Directory, docPath, keyPath } from "./pathUtils";
import archiver from "archiver";
import { randomUUID } from "crypto";
import { Readable } from "stream";
import { extname, join, relative } from "path";
import { readdir, rm } from "fs/promises";

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

export const uploadAnything = async (objKey: string, data: Readable | Buffer | string) => {
  await minioClient.putObject(S3_BUCKET_NAME, keyPath(objKey), data);
}

export const stat = async (objKey: string) => {
  const data = await minioClient.statObject(S3_BUCKET_NAME, keyPath(objKey));
  return {
    size: data.size,
    metadata: data.metaData,
  }
}

export const downloadTemp = async (objKey: string) => {
  const downloadPath = "/tmp/" + randomUUID() + extname(objKey);
  await minioClient.fGetObject(S3_BUCKET_NAME, keyPath(objKey), downloadPath);
  setTimeout(() => {
    rm(downloadPath).then().catch()
  }, 1000 * 3600 * 2); // erase temp after 2 hours
  return downloadPath; 
}

export const uploadDir = async (src: string, dest: string) => {
  const entries = await readdir(src, { withFileTypes: true, recursive: true });
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    if (entry.isDirectory()) continue;
    const relativePath = relative(src, entry.parentPath);
    const objKey = join(dest, relativePath);
    await minioClient.fPutObject(S3_BUCKET_NAME, objKey, entry.parentPath);
  }
}

export const copyObj = async (src: string, dest: string) => {
  await minioClient.copyObject(S3_BUCKET_NAME, keyPath(src), keyPath(dest));
}

export const deleteObj = async (objKey: string) => {
  await minioClient.removeObject(S3_BUCKET_NAME, keyPath(objKey));
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
