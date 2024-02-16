import { exec } from "child_process";
import { promisify } from "util";
import * as pathUtils from "./pathUtils";
import path from "path";
import { Logger } from "pino";
import fs from "fs/promises";
import tokml from "tokml";
import shp2json from "shpjs";
import { GeoJson } from "./geojsonUtils";
import { randomUUID } from "crypto";
import { DirPath, Directory } from "../constants";
import archiver from "archiver";
import { createWriteStream } from "fs";
import { Stream } from "stream";
import initGdalJs from "gdal3.js/node";
import { DOMParser } from "xmldom";
import togeojson from "@mapbox/togeojson";

const asyncExec = promisify(exec);

/**
 * Takes pointcloud file path, returns web view index page path or undefined
 */
export const savePointcloud = async (
  doc: pathUtils.DirPath | pathUtils.DocPath,
  log?: Logger
) => {
  const absDocPath = pathUtils.absPath(pathUtils.Directory.ROOT, doc);
  const filename = path.parse(doc).name;
  const outputDirPath = pathUtils.docPath(pathUtils.Directory.DOCUMENTS, "/");
  const absOutputPath = pathUtils.absPath(
    pathUtils.Directory.ROOT,
    outputDirPath
  );
  try {
    await asyncExec(
      `/bin/PotreeConverter ${absDocPath} -o ${absOutputPath} --generate-page ${filename}`
    );
    return outputDirPath + ".html";
  } catch (err) {
    log && log.error(err);
    return undefined;
  }
};

const getFlagColor = (geojson: GeoJson) => {
  const colorSet = new Set(
    geojson.features.map((feature) => feature.properties.color)
  );
  if (colorSet.size > 1) {
    return "multiColor";
  }
  return colorSet.values().next().value;
};
/**
 * Takes layer path, converts to geojson if necessary, and returns the geojson path. Also cleans up.
 */
export const saveVectorLayer = async (
  layer: pathUtils.DocPath | pathUtils.DirPath | GeoJson,
  options?: {
    icon: string;
    color: string;
  }
) => {
  let layerPath = "";
  let geojsonData: GeoJson;
  if (typeof layer == "string") {
    layerPath = layer;
  } else {
    geojsonData = layer;
    layerPath = pathUtils.docPath(
      pathUtils.Directory.VECTOR,
      randomUUID() + ".geojson"
    );
  }
  const ext = path.extname(layerPath).toLowerCase();
  const absLayerPath = pathUtils.absPath(pathUtils.Directory.ROOT, layerPath);
  const geojsonPath = pathUtils.docPath(
    pathUtils.Directory.VECTOR,
    path.parse(layerPath).name + ".geojson"
  );
  const absGeojsonPath = pathUtils.absPath(
    pathUtils.Directory.ROOT,
    geojsonPath
  );
  let flagColor = "multiColor";
  try {
    if (ext == ".geojson") {
      // ===== Check CRS and convert to EPSG:4326 if necessary =====

      const gdal = await initGdalJs();
      const dataset = (await gdal.open(absLayerPath)).datasets[0];
      const info = await gdal.ogrinfo(dataset);

      const { authority, code } = info.layers[0].geometryFields[0].coordinateSystem.projjson.id;
      const existingCRS = `${authority}:${code}`;

      if(existingCRS !== "EPSG:4326") {
        const options = [
            '-f', 'GeoJSON',
            '-t_srs', 'EPSG:4326'
        ];
        const output = await gdal.ogr2ogr(dataset, options);
        const bytes = await gdal.getFileBytes(output); // it is an Uint8Array
        geojsonData = JSON.parse(Buffer.from(bytes).toString("utf-8"));
      } else {
        geojsonData = JSON.parse(await fs.readFile(absLayerPath, "utf8"));
      }
      
      if(geojsonData.crs) delete geojsonData.crs;
      
      // ===========================================================
    }
    if (ext == ".kml") {
      const fileData = await fs.readFile(absLayerPath, "utf8");
      const kmlData = new DOMParser().parseFromString(fileData, "text/xml");
      geojsonData = togeojson.kml(kmlData, { styles: true });
    }
    if (ext == ".zip") {
      const fileData = await fs.readFile(absLayerPath);
      geojsonData = await shp2json(fileData);
    }
    if (geojsonData) {
      if (options) {
        geojsonData.features.forEach(
          (feature) =>
            (feature.properties = {
              ...feature.properties,
              ...options,
            })
        );
        flagColor = options.color;
      } else {
        flagColor = getFlagColor(geojsonData);
      }
      const stringData = JSON.stringify(geojsonData);
      try {
        await fs.rm(absLayerPath);
      } catch (err) {
        console.error(err);
      }
      await fs.writeFile(absGeojsonPath, stringData);
      return {
        geojsonPath,
        size: stringData.length / (1024 * 1024),
        featureCount: geojsonData.features.length,
        flagColor,
        properties: geojsonData.features[0]?.properties,
      };
    }
  } catch (error) {
    console.error(error);
    return undefined;
  }
};

const populateMultiGeojson = async (
  geojsons: { path: pathUtils.DocPath; map?: Record<string, string> }[],
  options?: { color?: string; icon?: string }
): Promise<GeoJson> => {
  const geojsonObject = {
    type: "FeatureCollection",
    name: "geojson",
    crs: {
      type: "name",
      properties: {
        name: "urn:ogc:def:crs:OGC:1.3:CRS84",
      },
    },
    errno: 0,
    features: [],
  };
  await Promise.allSettled(
    geojsons.map(async (geojsonFile) => {
      const geojson = JSON.parse(
        await fs.readFile(
          pathUtils.absPath(pathUtils.Directory.ROOT, geojsonFile.path),
          "utf8"
        )
      ) as GeoJson;
      const map = geojsonFile.map;
      if (map || options) {
        geojson.features.forEach((feature) => {
          if (map) {
            for (const [key, val] of Object.entries(map)) {
              feature.properties[val] = feature.properties[key];
            }
          }
          if (options) {
            feature.properties = {
              ...feature.properties,
              ...options,
            };
          }
        });
      }
      geojsonObject.features.push(...geojson.features);
    })
  );
  return geojsonObject;
};

/**
 * Takes geojson object or non-abs path and attributes to filter, returns new geojson path
 */
export const saveGeojson = async (
  geojson: pathUtils.DocPath | GeoJson,
  options?: {
    color?: string;
    name?: string;
    type?: string;
    filter?: string[];
    inplace?: boolean;
  }
) => {
  let geojsonObject: GeoJson;
  let geojsonPath = "";
  let absGeojsonPath = "";
  if (typeof geojson == "string") {
    absGeojsonPath = pathUtils.absPath(pathUtils.Directory.ROOT, geojson);
    geojsonPath = geojson;
    const stringData = await fs.readFile(absGeojsonPath, "utf8");
    geojsonObject = JSON.parse(stringData) as GeoJson;
  } else {
    geojsonObject = geojson;
  }
  if (!options?.inplace) {
    geojsonPath = pathUtils.docPath(
      pathUtils.Directory.VECTOR,
      randomUUID() + ".geojson"
    );
    absGeojsonPath = pathUtils.absPath(pathUtils.Directory.ROOT, geojsonPath);
  }
  if (options?.color || options?.filter) {
    geojsonObject.features.forEach((feature) => {
      if (options.filter) {
        for (const key of Object.keys(feature.properties)) {
          if (!options.filter.includes(key)) {
            delete feature.properties[key];
          }
        }
      }
      if (options.color) {
        feature.properties.color = options.color;
      }
    });
  }
  if (options?.name) geojsonObject.name = options.name;
  if (options?.type) geojsonObject.type = options.type;
  await fs.writeFile(absGeojsonPath, JSON.stringify(geojsonObject));
  return geojsonPath;
};

/**
 * Takes geojson object or non-abs path and attributes to filter, returns new geojson path
 */
export const saveMultiGeojson = async (
  geojsons: { path: pathUtils.DocPath; map?: Record<string, string> }[],
  {
    name,
    color,
    filter,
  }: {
    name?: string;
    color?: string;
    filter?: string[];
  }
) => {
  const clonedGeojsonPath = pathUtils.docPath(
    pathUtils.Directory.VECTOR,
    randomUUID() + ".geojson"
  );
  const absClonedPath = pathUtils.absPath(
    pathUtils.Directory.ROOT,
    clonedGeojsonPath
  );
  const geojsonObject = await populateMultiGeojson(geojsons, { color });
  if (filter)
    geojsonObject.features.forEach((feature) => {
      for (const key of Object.keys(feature.properties)) {
        if (!filter.includes(key)) {
          delete feature.properties[key];
        }
      }
    });
  if (name) {
    geojsonObject.name = name;
  }
  const featureCount = geojsonObject.features.length;
  await fs.writeFile(absClonedPath, JSON.stringify(geojsonObject));
  const size = (await fs.stat(absClonedPath)).size / (1024 * 1024);
  return { path: clonedGeojsonPath, size, featureCount };
};

export const saveAsKML = async (geojson: GeoJson, layerpath: string) => {
  try {
    const kmlData = String(tokml(JSON.parse(JSON.stringify(geojson))));
    const kmlPath = layerpath.replace(".geojson", ".kml");
    await fs.writeFile(DirPath(Directory.ROOT, kmlPath), kmlData);
    return kmlPath;
  } catch (error) {
    return "";
  }
};

export const saveAIMLFile = async (filename: string, data: string) => {
  try {
    await fs.writeFile(DirPath(Directory.AI_ML, filename), data);
    return true;
  } catch (error) {
    return false;
  }
};

export const createArchive = async (files: pathUtils.DocPath[]) => {
  const archivePath = pathUtils.docPath(
    pathUtils.Directory.TEMP,
    randomUUID() + ".zip"
  );
  const absArchivePath = pathUtils.absPath(
    pathUtils.Directory.ROOT,
    archivePath
  );
  const output = createWriteStream(absArchivePath);
  const archive = archiver("zip", {
    zlib: { level: 9 }, // Sets the compression level.
  });
  files.forEach((file) => {
    archive.file(pathUtils.absPath(pathUtils.Directory.ROOT, file), {
      name: file,
    });
  });
  archive.pipe(output);
  await archive.finalize();
  return archivePath;
};

export const saveFile = async (
  directory: pathUtils.Directory,
  filename: string,
  data:
    | string
    | NodeJS.ArrayBufferView
    | Iterable<string | NodeJS.ArrayBufferView>
    | AsyncIterable<string | NodeJS.ArrayBufferView>
    | Stream,
  encoding?: BufferEncoding
) => {
  const abspath = pathUtils.absPath(directory, filename);
  await fs.writeFile(abspath, data, { encoding });
  return await fs.stat(abspath);
};

export const readFile = async (fullpath: string) => {
  return await fs.readFile(fullpath);
};
