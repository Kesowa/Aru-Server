import fs from "fs";
import * as pathUtils from "./pathUtils";
import path from "path";
import unzipper from "unzipper";

export async function ZipToTiles3D(docLaz: string) {
  const name = path.parse(docLaz).name;
  const docDir = pathUtils.docPath(pathUtils.Directory.CESIUM_3D, name);
  const absDir = pathUtils.absPath(pathUtils.Directory.ROOT, docDir);
  const absZip = pathUtils.absPath(pathUtils.Directory.ROOT, docLaz);
  const directory = await unzipper.Open.file(absZip);
  if (
    directory.files.findIndex(
      (entry) => entry.type == "File" && entry.path == "tileset.json"
    ) == -1
  ) {
    // tileset.json not found
    return undefined;
  }
  await fs
    .createReadStream(absZip)
    .pipe(unzipper.Extract({ path: absDir }))
    .promise();
  return path.join(docDir, "tileset.json");
}
