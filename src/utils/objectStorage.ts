import * as Minio from "minio";
import { S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY } from "../constants";

export const minioClient = new Minio.Client({
  endPoint: S3_ENDPOINT,
  port: 9000,
  useSSL: false,
  accessKey: S3_ACCESS_KEY,
  secretKey: S3_SECRET_KEY,
})
