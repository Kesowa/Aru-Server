import { randomUUID } from "crypto";
import path, { extname } from "path";
import { Readable } from "stream";

import togeojson from "@mapbox/togeojson";
import { truncate } from "@turf/turf";
import { ObjectId } from "bson";
import Fuse from "fuse.js";
import { Types } from "mongoose";
import ObjectsToCsv from "objects-to-csv";
import shp2json from "shpjs";
import { toKML } from "@placemarkio/tokml";
import { GeoJson, readGeoJson } from "./geojsonUtils";
import { Directory } from "../constants";

import { DOMParser } from "@xmldom/xmldom";

import { deletePublicFileUsingPath } from "./fileDeleteUtils";
import {
  archive,
  copyObj,
  deleteObj,
  readToBuffer,
  readToString,
  stat,
  uploadAnything,
  uploadString,
} from "./objectStorage";

import * as pathUtils from "./pathUtils";
import Document from "../models/document";
import { VectorStyle, VectorStyleType } from "./layerUtils";

const getFlagColor = (geojson: GeoJson) => {
  const colorSet = new Set(
    geojson.features.map((feature) => feature.properties.color),
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
    icon?: string;
    color?: string;
    inheritColor?: boolean;
  } = {
    icon: "Marker",
    color: "#666",
    inheritColor: false,
  },
  styling?: VectorStyleType,
) => {
  let parsedStyling: VectorStyleType | null = null;
  if (styling) {
    const parsed = VectorStyle.safeParse(styling);
    if (parsed.success)
      parsedStyling = parsed.data;
  };
  const targetPath = pathUtils.docPath(
    pathUtils.Directory.VECTOR,
    randomUUID() + ".geojson",
  );
  let geojsonData: GeoJson;
  if (typeof layer == "string") {
    const ext = path.extname(layer).toLowerCase();
    if (ext == ".geojson") {
      geojsonData = JSON.parse(await readToString(layer));
    } else if (ext == ".kml") {
      const fileData = await readToString(layer);
      const kmlData = new DOMParser().parseFromString(fileData, "text/xml");
      geojsonData = togeojson.kml(kmlData, { styles: true });
    } else if (ext == ".zip") {
      const fileData = await readToBuffer(layer);
      geojsonData = await shp2json(fileData);
    }
    await deleteObj(layer);
  } else {
    geojsonData = layer;
  }
  if (!geojsonData) return null;

  if (parsedStyling) {
    geojsonData.styling = parsedStyling;
  };

  geojsonData.features.forEach(
    (feature) =>
      (feature.properties = {
        ...feature.properties,
        icon: options.icon,
        color: options.inheritColor
          ? feature.properties.color || options.color
          : options.color,
      }),
  );
  let flagColor = !options.inheritColor
    ? options.color
    : getFlagColor(geojsonData);

  const featureTypes = new Set<GeoJson["type"]>();
  geojsonData.features.forEach((feature) => {
    feature.properties.sys_id = new ObjectId().toHexString();
    feature.geometry.coordinates = truncate(feature, {
      coordinates: 2,
    }).geometry.coordinates;
    featureTypes.add(feature.geometry.type.replace(/^Multi/, "")); // Handles MultiGeometry
  });
  console.log({ featureTypes });
  const stringData = JSON.stringify(geojsonData);
  await uploadString(targetPath, stringData);
  return {
    geojsonPath: targetPath,
    size: stringData.length / (1024 * 1024),
    featureCount: geojsonData.features.length,
    flagColor,
    properties: geojsonData.features[0]?.properties,
    featureTypes: Array.from(featureTypes.values()),
  };
};

const populateMultiGeojson = async (
  geojsons: { path: pathUtils.DocPath; map?: Record<string, string> }[],
  options?: { color?: string; icon?: string },
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
        await readToString(geojsonFile.path),
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
    }),
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
  },
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
  const geojsonPath = pathUtils.docPath(
    Directory.VECTOR,
    randomUUID() + ".geojson",
  );
  const stringData = JSON.stringify(geojsonObject);
  const size = stringData.length / (1024 * 1024);
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
  },
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
  const geojsonPath = pathUtils.docPath(
    Directory.VECTOR,
    randomUUID() + ".geojson",
  );
  await uploadString(geojsonPath, stringData);
  const size = stringData.length / (1024 * 1024);
  return { path: geojsonPath, size, featureCount };
};

export const saveAsKML = async (
  filename: string,
  geojson: GeoJson,
  missionId: Types.ObjectId | string,
  tenantId: Types.ObjectId | string,
  userId: Types.ObjectId | string,
) => {
  const exists = await Document.findOne({ name: filename });
  if (exists) await exists.delete();
  const kmlData = toKML(geojson as any);
  const { filepath, size } = await saveFile(
    Directory.VECTOR,
    filename,
    kmlData,
  );
  const kmlDoc = new Document({
    name: filename,
    modDate: new Date(),
    fileSize: size / (1024 * 1024),
    fileType: "csv",
    folderName: "root1234",
    filePath: filepath,
    missionId,
    tenantId,
    createdBy: userId,
    updatedBy: userId,
  });
  await kmlDoc.create();
  return { filepath, size };
};

export const saveCSV = async (
  filename: string,
  data: any,
  missionId: Types.ObjectId | string,
  tenantId: Types.ObjectId | string,
  userId: Types.ObjectId | string,
) => {
  const exists = await Document.findOne({ name: filename });
  if (exists) await exists.delete();
  const csv = new ObjectsToCsv(data);
  const csvData = await csv.toString();
  const { filepath, size } = await saveFile(Directory.CSV, filename, csvData);
  const csvDoc = new Document({
    name: filename,
    modDate: new Date(),
    fileSize: size / (1024 * 1024),
    fileType: "csv",
    folderName: "root1234",
    filePath: filepath,
    [missionId !== "" && "missionId"]: missionId,
    tenantId,
    createdBy: userId,
    updatedBy: userId,
  });
  await csvDoc.create();
  return { filepath, size };
};

export const createArchive = async (
  filename: string,
  files: pathUtils.DocPath[],
  missionId: Types.ObjectId | string,
  tenantId: Types.ObjectId | string,
  userId: Types.ObjectId | string,
) => {
  const exists = await Document.findOne({ name: filename });
  if (exists) await exists.delete();
  const archivePath = await archive(files);
  const { size } = await stat(archivePath);
  const archiveDoc = new Document({
    name: filename,
    modDate: new Date(),
    fileSize: size / (1024 * 1024),
    fileType: "csv",
    folderName: "root1234",
    filePath: archivePath,
    missionId,
    tenantId,
    createdBy: userId,
    updatedBy: userId,
  });
  await archiveDoc.create();
  return archivePath;
};

export const saveFile = async (
  dir: Directory,
  filename: string,
  data: string | Buffer | Readable,
) => {
  const filepath = pathUtils.docPath(dir, filename);
  await uploadAnything(filepath, data);
  return { filepath, ...(await stat(filepath)) };
};

export const copyFile = async (src: string, dest: string) => {
  await copyObj(src, dest);
};

export const readFile = async (filepath: string) => {
  return await readToBuffer(filepath);
};

export const permPath = async (dir: Directory, src: string) => {
  const fullPath = pathUtils.docPath(dir, randomUUID() + extname(src));
  await copyObj(src, fullPath);
  await deleteObj(src);
  return fullPath;
};
export const saveFeatureSearchIndex = async (layerPath: string) => {
  const filename = "index_" + path.parse(layerPath).name + ".json";
  const searchIndexPath = path.dirname(layerPath) + "/" + filename;
  const geojsonData = await readGeoJson<any>(layerPath);
  const keys = Object.keys(geojsonData.features[0].properties).map(
    (key) => `properties.${key}`,
  );
  const searchIndex = Fuse.createIndex<any>(keys, geojsonData.features);
  await uploadString(searchIndexPath, JSON.stringify(searchIndex.toJSON()));
  return pathUtils.docPath(Directory.VECTOR, filename);
};
export const deleteFeatureSearchIndex = async (layerPath: string) => {
  const filename = "index_" + path.parse(layerPath).name + ".json";
  const searchIndexPath = path.dirname(layerPath) + "/" + filename;
  await deletePublicFileUsingPath(searchIndexPath);
  return pathUtils.docPath(Directory.VECTOR, filename);
};
