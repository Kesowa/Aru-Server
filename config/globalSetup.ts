import { CreateDirs, DirPath, Directory } from "../src/constants";
import fs from "fs/promises";

export default async function () {
  CreateDirs();
  await fs.copyFile(
    "/app/assets/solar.geojson",
    DirPath(Directory.VECTOR, "solar.geojson")
  );
}
