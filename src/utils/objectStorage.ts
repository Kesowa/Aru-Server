import { randomUUID } from "crypto";
import { readdir, rm } from "fs/promises";
import { extname, join, relative } from "path";
import { Readable } from "stream";
import { buffer } from "stream/consumers";
import { finished } from "stream/promises";

import archiver from "archiver";
import * as Minio from "minio";

import {
  S3_ENDPOINT,
  S3_ACCESS_KEY,
  S3_SECRET_KEY,
  S3_BUCKET_NAME,
  ARU_INSTANCE,
  Instance,
} from "../constants";
import { Directory, docPath, keyPath } from "./pathUtils";

export const minioClient = new Minio.Client({
  endPoint: S3_ENDPOINT,
  useSSL: ARU_INSTANCE !== Instance.NKDA,
  region: "ap-south-1",
  accessKey: S3_ACCESS_KEY,
  secretKey: S3_SECRET_KEY,
  pathStyle: ARU_INSTANCE === Instance.NKDA,
});

export const readToString = async (objKey: string) => {
  const obj = await minioClient.getObject(S3_BUCKET_NAME, keyPath(objKey));
  const buf = await buffer(obj);
  return buf.toString("utf8");
};

export const readToBuffer = async (objKey: string) => {
  const obj = await minioClient.getObject(S3_BUCKET_NAME, keyPath(objKey));
  const buf = await buffer(obj);
  return buf;
};

export const uploadString = async (objKey: string, data: string) => {
  await minioClient.putObject(S3_BUCKET_NAME, keyPath(objKey), data);
};

export const uploadAnything = async (
  objKey: string,
  data: Readable | Buffer | string,
) => {
  await minioClient.putObject(S3_BUCKET_NAME, keyPath(objKey), data);
};

export const stat = async (objKey: string) => {
  const data = await minioClient.statObject(S3_BUCKET_NAME, keyPath(objKey));
  return {
    size: data.size,
    metadata: data.metaData,
  };
};

export const downloadTemp = async (objKey: string) => {
  const downloadPath = "/tmp/" + randomUUID() + extname(objKey);
  await minioClient.fGetObject(S3_BUCKET_NAME, keyPath(objKey), downloadPath);
  setTimeout(
    () => {
      rm(downloadPath).then().catch();
    },
    1000 * 3600 * 2,
  ); // erase temp after 2 hours
  return downloadPath;
};

export const uploadDir = async (src: string, dest: string) => {
  const entries = await readdir(src, { withFileTypes: true, recursive: true });
  for (const entry of entries) {
    if (entry.isDirectory()) continue;
    const relativePath = relative(src, entry.parentPath);
    const objKey = join(dest, relativePath);
    await minioClient.fPutObject(S3_BUCKET_NAME, objKey, entry.parentPath);
  }
};

export const copyObj = async (src: string, dest: string) => {
  await minioClient.copyObject(
    S3_BUCKET_NAME,
    keyPath(dest),
    "/" + S3_BUCKET_NAME + "/" + keyPath(src),
  );
};

export const deleteObj = async (objKey: string) => {
  await minioClient.removeObject(S3_BUCKET_NAME, keyPath(objKey));
};

export const deleteDir = async (dirKey: string) => {
  const entries = minioClient.listObjects(
    S3_BUCKET_NAME,
    keyPath(dirKey),
    true,
  );
  const batch = new Array<string>();
  for await (const obj of entries) {
    batch.push(obj.name);
    if (batch.length > 10) {
      await Promise.all(batch.map(deleteObj));
      batch.length = 0;
    }
  }
  await Promise.all(batch.map(deleteObj));
};

export const uploadFile = async (src: string, dest: string) => {
  await minioClient.fPutObject(S3_BUCKET_NAME, dest, src);
};

export const archive = async (objKeys: string[]) => {
  const archive = archiver("zip", {
    zlib: { level: 9 }, // Sets the compression level.
  });
  await Promise.all(
    objKeys.map(async (objKey) => {
      const stream = await minioClient.getObject(
        S3_BUCKET_NAME,
        keyPath(objKey),
      );
      archive.append(stream, {
        name: objKey,
      });
    }),
  );
  const archivePath = keyPath(docPath(Directory.TEMP, randomUUID() + ".zip"));
  await Promise.all([
    minioClient.putObject(S3_BUCKET_NAME, archivePath, archive),
    archive.finalize(),
  ]);
  return archivePath;
};
