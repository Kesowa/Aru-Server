import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import * as pathUtils from "./pathUtils";
import path from "path";

const asyncExec = promisify(exec);

export async function LazToTiles3D(docLaz: string) {
  const name = path.parse(docLaz).name;
  const docDir = pathUtils.docPath(pathUtils.Directory.POINT_CLOUD, name);
  const absDir = pathUtils.absPath(pathUtils.Directory.POINT_CLOUD, "");
  const absLaz = pathUtils.absPath(pathUtils.Directory.ROOT, docLaz);
  const absLas = pathUtils.absPath(pathUtils.Directory.TEMP, name + ".las");
  const { size } = await fs.stat(absLaz);
  if (size > 1e9) { // larger than 1GB
    return { error: "PointCloud too big for conversion!" }
  }
  await LazToLas(absLaz, absLas);
  await LasToTiles3D(absLas, absDir);
  await fs.rm(absLas);
  return path.join(docDir, "tileset.json");
}

async function LazToLas(absLaz: string, absLas: string) {
  await asyncExec(`las2las64 -i "${absLaz}" -o "${absLas}" -ellipsoid 23`);
}

async function LasToTiles3D(absLas: string, absTileDir: string) {
  if ((await fs.stat(absTileDir)).isDirectory() != true)
    await fs.mkdir(absTileDir);
  await asyncExec(
    `gocesiumtiler -a grid -grid-max-size 5 -grid-min-size 1 -i "${absLas}" -o "${absTileDir}" -srid 32633`
  );
}

export async function delete3DTiles(tilesetJson: string) {
  // check if it is really a tilesetJson string
  const decomposePath = path.parse(tilesetJson);
  const docDir = decomposePath.dir;
  const pointCloudDir = path.basename(path.dirname(docDir));
  const filename = decomposePath.base;
  if (
    filename == "tileset.json" &&
    pointCloudDir == pathUtils.Directory.POINT_CLOUD
  ) {
    // delete the directory containing 3D tiles
    await fs.rm(pathUtils.absPath(pathUtils.Directory.ROOT, docDir), {
      recursive: true,
    });
    return true;
  }
  return false;
}
