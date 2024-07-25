import { exec } from "child_process";
import { promisify } from "util";
import * as pathUtils from "./pathUtils";
import path from "path";
import tokml from "tokml";
import shp2json from "shpjs";
import { GeoJson } from "./geojsonUtils";
import { randomUUID } from "crypto";
import { Directory } from "../constants";
import { Readable } from "stream";
import { DOMParser } from "xmldom";
import togeojson from "@mapbox/togeojson";
import { ObjectId } from "bson";
import { archive, copyObj, downloadTemp, readToBuffer, readToString, stat, uploadAnything, uploadDir, uploadString } from "./objectStorage";
import { rm, rmdir } from "fs/promises";

const asyncExec = promisify(exec);

/**
 * Takes pointcloud file path, returns web view index page path or undefined
 */
export const savePointcloud = async ( doc: pathUtils.DocPath, ) => {
  const absDocPath = await downloadTemp(doc);
  const filename = path.parse(doc).name;
  const absOutputPath = "/tmp/" + randomUUID();
  const outputDirPath = pathUtils.docPath(pathUtils.Directory.DOCUMENTS, randomUUID());
  await asyncExec(
    `/bin/PotreeConverter ${absDocPath} -o ${absOutputPath} --generate-page ${filename}`
  );
  await uploadDir(absOutputPath, outputDirPath);
  await rm(absDocPath);
  await rmdir(absOutputPath);
  return outputDirPath + "filename" + ".html";
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
 * Takes layer path, converts to geojson if necessary, and returns the new geojson path. Also cleans up.
 */
export const saveVectorLayer = async (
  layer: pathUtils.DocPath | GeoJson,
  options: {
    icon: string;
    color: string;
    inheritColor: boolean;
  } = {
    icon: "Marker",
    color: "#666",
    inheritColor: false,
  }
) => {
  const targetPath = pathUtils.docPath(
    pathUtils.Directory.VECTOR,
    randomUUID() + ".geojson"
  );
  let geojsonData: GeoJson;
  if (typeof layer == "string") {
    const ext = path.extname(layer).toLowerCase();
    if (ext == ".geojson") {
      geojsonData = JSON.parse(await readToString(layer));
    }
    else if (ext == ".kml") {
      const fileData = await readToString(layer);
      const kmlData = new DOMParser().parseFromString(fileData, "text/xml");
      geojsonData = togeojson.kml(kmlData, { styles: true });
    }
    else if (ext == ".zip") {
      const fileData = await readToBuffer(layer);
      geojsonData = await shp2json(fileData);
    }
  } else {
    geojsonData = layer;
  } 
  if (!geojsonData)
    return null;
    
  let flagColor = "multiColor";
  geojsonData.features.forEach(
    (feature) =>
      (feature.properties = {
        ...feature.properties,
        icon: options.icon,
        color: options.inheritColor
          ? feature.properties.color || options.color
          : options.color,
      })
  );
  if (options.inheritColor == false) {
    flagColor = options.color;
  } else {
    flagColor = getFlagColor(geojsonData);
  }
  geojsonData.features.forEach((feature) => {
    feature.properties.sys_id = new ObjectId().toHexString();
  });
  const stringData = JSON.stringify(geojsonData);
  await uploadString(targetPath, stringData);
  return {
    geojsonPath: targetPath,
    size: stringData.length / (1024 * 1024),
    featureCount: geojsonData.features.length,
    flagColor,
    properties: geojsonData.features[0]?.properties,
  };
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
      const geojson = JSON.parse(await readToString(geojsonFile.path)) as GeoJson;
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
  }
) => {
  let geojsonObject: GeoJson;
  if (typeof geojson == "string") {
    const stringData = await readToString(geojson);
    geojsonObject = JSON.parse(stringData) as GeoJson;
  } else {
    geojsonObject = geojson;
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
  const geojsonPath = pathUtils.docPath(Directory.VECTOR, randomUUID() + ".geojson");
  const stringData = JSON.stringify(geojsonObject);
  const size = stringData.length / (1024*1024);
  await uploadString(geojsonPath, stringData);
  return { geojsonPath, size };
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
  const stringData = JSON.stringify(geojsonObject);
  const geojsonPath = pathUtils.docPath(Directory.VECTOR, randomUUID() + ".geojson");
  await uploadString(geojsonPath, stringData);
  const size = stringData.length / (1024 * 1024);
  return { path: geojsonPath, size, featureCount };
};

export const saveAsKML = async (geojson: GeoJson) => {
  const kmlData = String(tokml(geojson));
  const kmlPath = pathUtils.docPath(Directory.TEMP, randomUUID() + ".kml");
  await uploadString(kmlPath, kmlData);
  return kmlPath;
};

export const saveAIMLFile = async (filename: string, data: string) => {
  await uploadString(pathUtils.docPath(Directory.AI_ML, filename), data);
};

export const createArchive = async (files: pathUtils.DocPath[]) => {
  return await archive(files);
};

export const saveFile = async (
  dir: Directory,
  filename: string,
  data:
    | string
    | Buffer
    | Readable
) => {
  const filepath = pathUtils.docPath(dir, filename);
  await uploadAnything(filepath, data)
  return {filepath, ...(await stat(filepath)) };
};

export const copyFile = async (src: string, dest: string) => {
  await copyObj(src, dest);
}

export const readFile = async (filepath: string) => {
  return await readToBuffer(filepath)
};
