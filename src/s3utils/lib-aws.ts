import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { Readable, Stream } from "stream";
import { Upload } from "@aws-sdk/lib-storage";
import { buffer } from "stream/consumers";
import { AWS_S3_BUCKET as Bucket, ACCESS_KEY, AWS_SECRET_KEY, AWS_S3_ENDPOINT, Mode, MODE } from "../constants";

const s3Endpoint = Mode.Dev == MODE ? AWS_S3_ENDPOINT : undefined;

const Client = new S3Client({
  credentials: {
    accessKeyId: ACCESS_KEY,
    secretAccessKey: AWS_SECRET_KEY,
  },
  region: "ap-south-1",
  endpoint: s3Endpoint,
  endpointProvider: () => ({
    url: new URL(s3Endpoint + "/" + Bucket),
  })
});

const uploadStream = (dest: string) => {
  const pass = new Stream.PassThrough();
  return {
    writeStream: pass,
    promise: writeStream(dest, pass),
  };
};

const stat = async (path: string) => {
  const metadata = new HeadObjectCommand({
    Bucket,
    Key: path,
  });
  try {
    // if file(key) is not found, then exception will be thrown
    const output = await Client.send(metadata);
    return { size: output.ContentLength };
  } catch(error) {
    return { size: -1 };
  }
};

const copyFile = async (src: string, dest: string) => {
  const copy = new CopyObjectCommand({
    Bucket,
    CopySource: Bucket + "/" + src,
    Key: dest,
  });
  await Client.send(copy);
};

const rm = async (path: string) => {
  const deleted = new DeleteObjectCommand({
    Bucket,
    Key: path,
  });
  await Client.send(deleted);
};

const writeFile = async (dest: string, data: Buffer | string) => {
  const upload = new Upload({
    client: Client,
    params: {
      Bucket,
      Key: dest,
      Body: data,
    },
  });
  await upload.done();
};

const readFile = async (path: string) => {
  const read = await readStream(path);
  return buffer(read);
};

const readStream = async (path: string) => {
  const read = new GetObjectCommand({
    Bucket,
    Key: path,
  });

  const output = await Client.send(read);
  return output.Body as Readable;
};

const writeStream = async (dest: string, stream: Readable) => {
  const upload = new Upload({
    client: Client,
    params: {
      Bucket,
      Key: dest,
      Body: stream,
    },
  });
  await upload.done();
};

const rename = async (src: string, dest: string) => {
  await copyFile(src, dest);
  await rm(src);
};

export default {
  uploadStream,
  stat,
  copyFile,
  rm,
  writeFile,
  readFile,
  rename,
  writeStream,
  readStream,
};