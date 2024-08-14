import * as pathUtils from "./pathUtils";
import path from "path";
import unzipper from "unzipper";
import { minioClient, uploadAnything } from "./objectStorage";
import { S3_BUCKET_NAME } from "../constants";
import { PassThrough } from "stream";
import { deletePublicFolderUsingPath } from "./fileDeleteUtils";
import { logger } from "../app";

export async function ZipToTiles3D(zipDoc: string) {
  const name = path.parse(zipDoc).name;
  const docDir = pathUtils.docPath(pathUtils.Directory.CESIUM_3D, name);
  const customSource = {
    stream: function(offset: number, length: number) {
      const pass = new PassThrough();
      minioClient.getPartialObject(
        S3_BUCKET_NAME,
        pathUtils.keyPath(zipDoc),
        offset,
        length
      )
        .then(stream => stream.pipe(pass))
        .catch(err => pass.destroy(err));
      return pass;
    },
    size: async function() {
      const objMetadata = await minioClient.statObject(S3_BUCKET_NAME, pathUtils.keyPath(zipDoc));
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

export async function delete3DTiles(tilesetJson: string) {
  // check if it is really a tilesetJson string
  logger.info(tilesetJson, "TILESETJSON");
  const decomposePath = path.parse(tilesetJson);
  const docDir = decomposePath.dir;
  const filename = decomposePath.base;
  if (
    filename == "tileset.json" 
  ) {
    // delete the directory containing 3D tiles
    return await deletePublicFolderUsingPath(docDir)
  }
  return false;
}
