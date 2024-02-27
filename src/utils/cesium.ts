import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { createReadStream } from "fs";
import path from "path";

export async function uploadPointCloud(token: string, filePath: string, name: string) {

  const postBody = {
    name: name,
    description: 'See [Wikipedia](https://en.wikipedia.org/?curid=217577).',
    type: '3DTILES',
    options: {
      sourceType: 'POINT_CLOUD',
      clampToTerrain: true,
      baseTerrainId: 1
    }
  }
  let response = await fetch(
    "https://api.cesium.com/v1/assets",
    {
      method: "post",
      headers: {
        "Authorization": `Bearer ${token}`,
        "content-type": "application/json; charset=utf-8"
      },
      body: JSON.stringify(postBody),
    }
  );
  let data = await response.json() as AssetResponse;
  await uploadFile({
    aws: data.uploadLocation,
    filePath
  })
  response = await fetch(data.onComplete.url, {
    method: data.onComplete.method,
    body: JSON.stringify(data.onComplete.fields),
    headers: {
      "Authorization": `Bearer ${token}`,
      "content-type": "application/json; charset=utf-8"
    },
  });
  return data.assetMetadata;
}


async function uploadFile(options: {
  aws: {
    bucket: string,
    accessKey: string,
    secretAccessKey: string,
    sessionToken: string,
    endpoint: string,
    prefix: string,
  },
  filePath: string,
}) {
  const readStream = createReadStream(options.filePath)
  const cmd = new PutObjectCommand({
    Bucket: options.aws.bucket,
    Key: path.join(options.aws.prefix, path.basename(options.filePath)),
    Body: readStream
  })
  const s3 = new S3Client({
    credentials: {
      accessKeyId: options.aws.accessKey,
      secretAccessKey: options.aws.secretAccessKey,
      sessionToken: options.aws.sessionToken,
    },
    endpoint: options.aws.endpoint,
    region: "us-east-1"
  });
  await s3.send(cmd)
}
type AssetResponse =
  {
    assetMetadata: {
      id: number,
      type: string,
      name: string,
      description: string,
      bytes: number,
      attribution: string,
      dateAdded: string,
      exportable: true,
      status: string,
      percentComplete: number,
      archivable: true
    },
    uploadLocation: {
      bucket: string,
      endpoint: string,
      prefix: string,
      accessKey: string,
      secretAccessKey: string,
      sessionToken: string
    },
    onComplete: {
      method: string,
      url: string,
      fields: {}
    }
  }
export type CesiumMetadata = AssetResponse["assetMetadata"];
