import * as pathUtils from "./pathUtils";
import path from "path";
import unzipper from "unzipper";
import { minioClient, uploadAnything } from "./objectStorage";
import { S3_BUCKET_NAME } from "../constants";
import { PassThrough } from "stream";

export async function ZipToTiles3D(docLaz: string) {
  const name = path.parse(docLaz).name;
  const docDir = pathUtils.docPath(pathUtils.Directory.CESIUM_3D, name);
  const customSource = {
    stream: function(offset: number, length: number) {
      const pass = new PassThrough();
      minioClient.getPartialObject(
        S3_BUCKET_NAME,
        pathUtils.keyPath(docLaz),
        offset,
        length
      )
        .then(stream => stream.pipe(pass))
        .catch(err => pass.destroy(err));
      return pass;
    },
    size: async function() {
      const objMetadata = await minioClient.statObject(S3_BUCKET_NAME, pathUtils.keyPath(docLaz));
      return objMetadata.size;
    }
  };

  // @ts-ignore
  const directory = await unzipper.Open.custom(customSource) as unzipper.CentralDirectory;
  if (
    directory.files.findIndex(
      (entry) => entry.type == "File" && entry.path == "tileset.json"
    ) == -1
  ) {
    // tileset.json not found
    return undefined;
  }
  for (let i = 0; i < directory.files.length; i += 10) {
    await Promise.allSettled(
      directory.files.slice(i, i + 10)
        .filter(file => file.type == "File")
        .map(
          async (file) => {
            await uploadAnything(
              path.join(docDir, file.path),
              await file.buffer()
            );
          }
        )
    );
  }
  return path.join(docDir, "tileset.json");
}
