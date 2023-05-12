import busboy from "busboy";
import AWS from "aws-sdk";
import sharp from "sharp";
import {
  ACCESS_KEY,
  AWS_S3_BUCKET,
  AWS_S3_ENDPOINT,
  AWS_SECRET_KEY,
  Directory,
} from "../constants";
import { randomUUID } from "crypto";

const s3 = new AWS.S3({
  accessKeyId: ACCESS_KEY,
  secretAccessKey: AWS_SECRET_KEY,
  endpoint: AWS_S3_ENDPOINT,
});

function uploadToS3(
  key: string,
  body: NodeJS.ReadableStream,
  contentType: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    s3.upload(
      {
        Bucket: AWS_S3_BUCKET,
        Key: key,
        Body: body,
        ContentType: contentType,
      },
      (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data.Location);
        }
      }
    );
  });
}

export function uploadMultiple(req: any, res: any) {
  async function handleError(fn: any) {
    try {
      await fn();
    } catch (error) {
      console.log(`error message: ${error}`);
      res.status(400).json({
        message: `${error}`,
      });
    }
  }

  const bb = busboy({ headers: req.headers });

  let originalImageStream, originalImageKey;
  let resizedImageStream, resizedImageKey;

  bb.on("field", (name: any, value: any) => {
    handleError(() => {
      if (!value) {
        throw new Error("Please attach image");
      }
    });
  });

  bb.on("file", async (fieldname: any, file: any, info: any) => {
    handleError(async () => {
      const { filename, encoding, mimeType } = info;

      const uuid = randomUUID();

      originalImageKey = `${Directory.ALERT_IMAGES}/${uuid}`;
      originalImageStream = file;

      resizedImageKey = `${Directory.ALERT_IMAGES}/min/${uuid}`;
      resizedImageStream = sharp();
      file.pipe(resizedImageStream);

      const originalImagePromise = uploadToS3(
        originalImageKey,
        originalImageStream,
        mimeType
      );

      const resizedImageBufferPromise = resizedImageStream
        .resize(120, 120)
        .toBuffer();

      const resizedImagePromise = Promise.all([
        resizedImageBufferPromise,
        uploadToS3(resizedImageKey, resizedImageStream, mimeType),
      ]);

      const [originalImageUrl] = await Promise.all([
        originalImagePromise,
        resizedImagePromise,
      ]);
      const [, resizedImageUrl] = await resizedImagePromise;

      console.log(originalImageUrl, resizedImageUrl);

      res.status(201).json({
        status: "success",
        originalImageUrl,
        resizedImageUrl,
      });
    });
  });

  req.pipe(bb);
}
