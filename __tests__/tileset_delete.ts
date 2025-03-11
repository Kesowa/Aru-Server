import fs from "fs/promises";
import type { Content, Tile, Tileset } from "../src/typings/tileset";
import path from "path";

async function deleteTileset(tilesetPath: string) {
  const tileset = JSON.parse(await readToString(tilesetPath)) as Tileset;
  const root = path.dirname(tilesetPath);
  await deleteTile(root, tileset.root);
  await deleteObj(tilesetPath);
}

async function deleteTile(root: string, tile: Tile) {
  if (tile.children?.length) {
    for (const child of tile.children) {
      await deleteTile(root, child);
    }
  }
  if (tile.contents?.length) {
    for (const content of tile.contents) await deleteContent(root, content);
  } else if (tile.content) {
    await deleteContent(root, tile.content);
  }
}

async function deleteContent(root: string, content: Content) {
  const fullPath = path.join(root, content.uri);
  if (content.uri.endsWith(".json")) {
    const tileset = JSON.parse(await readToString(fullPath)) as Tileset;
    await deleteTile(path.join(root, path.dirname(content.uri)), tileset.root);
    await deleteObj(fullPath);
  }
  else {
    await deleteObj(fullPath);
  }
}


async function readToString(path: string) {
  return await fs.readFile(path, "utf8");
}

function deleteObj(path: string) {
  console.log("DELETE: ", path);
  return new Promise(res => setTimeout(res, 500));
}

deleteTileset("./tileset/tileset.json").catch(console.error);
