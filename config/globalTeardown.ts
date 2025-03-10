import { Directory, DirPath } from "../src/constants";
import fs from "fs/promises";

export default async function () {
  await Promise.all(
    Object.values(Directory)
      .map((dir) => DirPath(dir))
      .map((path) => fs.rm(path, { recursive: true })),
  );
}
