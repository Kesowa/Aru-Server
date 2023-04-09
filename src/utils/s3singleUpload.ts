import * as AWS from "aws-sdk";
const Busboy = require("busboy");
import { IncomingMessage } from "http";
import { Directory } from "../constants";
import { randomUUID } from "crypto";

const s3 = new AWS.S3({
  accessKeyId: process.env.S3_KEY_ID,
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
});

function uploadToS3(
  stream: NodeJS.ReadableStream,
  key: string,
  contentType: string
) {
  console.log("inside upload to s3");

  return new Promise<string>((resolve, reject) => {
    const params: AWS.S3.PutObjectRequest = {
      Bucket: "kesowa-static",
      Key: key,
      Body: stream,
      ContentType: contentType,
    };

    s3.upload(params, (err: Error, data: AWS.S3.ManagedUpload.SendData) => {
      if (err) {
        reject(err);
      } else {
        resolve(data.Location);
      }
    });
  });
}

export function uploadSingle(req: IncomingMessage, res: any, next: any) {
  async function handleError(fn) {
    try {
      await fn();
    } catch (error) {
      console.log(`error message: ${error}`);
      res.status(400).json({
        message: `${error}`,
      });
    }
  }

  const bb = Busboy({ headers: req.headers });

  bb.on("field", (name, value) => {
    handleError(() => {
      if (!value) {
        throw new Error("Please attach image");
      }
    });
  });

  bb.on("file", async (name, file, info) => {
    handleError(async () => {
      const { filename, encoding, mimeType } = info;

      const key = `${Directory.ALERT_IMAGES}/${randomUUID()}`;
      const contentType = mimeType;

      const uploadPromise = await uploadToS3(file, key, contentType);

      console.log(uploadPromise);

      if (uploadPromise) {
        next();
      }
    });
  });
  req.pipe(bb);
}
