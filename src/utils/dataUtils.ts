import { exec } from "child_process"
import { promisify } from "util"
import * as pathUtils from "./pathUtils";
import path from "path";
import { Logger } from "pino";
import fs from "fs/promises";
import kmlToGjson from "tokml";
import shp2json from "shpjs";
import { GeoJson } from "./geojsonUtils";
import { randomUUID } from "crypto";

const asyncExec = promisify(exec);

/**
 * Takes pointcloud file path, returns web view index page path or undefined
 */
export const savePointcloud = async (doc: pathUtils.DirPath | pathUtils.DocPath, log?: Logger) => {
  const absDocPath = pathUtils.absPath(pathUtils.Directory.ROOT, doc);
  const filename = path.parse(doc).name;
  const outputDirPath = pathUtils.docPath(pathUtils.Directory.DOCUMENTS, "/");
  const absOutputPath = pathUtils.absPath(pathUtils.Directory.ROOT, outputDirPath);
  try {
    await asyncExec(
      `/bin/PotreeConverter ${absDocPath} -o ${absOutputPath} --generate-page ${filename}`
    );
    return outputDirPath + ".html"
  } catch (err) {
    log && log.error(err);
    return undefined;
  }
}

const getFlagColor = (geojson: GeoJson) => {
  const colorSet = new Set(geojson.features.map(feature => feature.properties.color));
  if (colorSet.size > 1) {
    return "multiColor";
  }
  return colorSet.values().next().value;
}
/**
 * Takes layer path, converts to geojson if necessary, and returns the geojson path. Also cleans up.
 */
export const saveVectorLayer = async (layer: pathUtils.DocPath | pathUtils.DirPath | GeoJson, options?: {
  icon: string,
  color: string,
}) => {
  let layerPath = "";
  let geojsonData: GeoJson;
  if (typeof layer == "string") {
    layerPath = layer;
  }
  else {
    geojsonData = layer;
    layerPath = randomUUID();
  }
  const ext = path.extname(layerPath).toLowerCase();
  const absLayerPath = pathUtils.absPath(pathUtils.Directory.ROOT, layerPath);
  const geojsonPath = pathUtils.docPath(pathUtils.Directory.VECTOR, path.parse(layerPath).name + ".geojson");
  const absGeojsonPath = pathUtils.absPath(pathUtils.Directory.ROOT, geojsonPath);
  let flagColor = "multiColor";
  try {
    if (ext == ".geojson") {
      geojsonData = JSON.parse(await fs.readFile(absLayerPath, "utf8"));
    }
    if (ext == ".kml") {
      const fileData = await fs.readFile(absLayerPath, "utf8");
      const kmlData = new DOMParser().parseFromString(fileData, "text/xml");
      geojsonData = kmlToGjson.kml(kmlData, { styles: true });
    }
    if (ext == ".shp" || ext == ".zip") {
      const fileData = await fs.readFile(absLayerPath);
      geojsonData = await shp2json(fileData);
    }
    if (geojsonData) {
      if (options) {
        geojsonData.features.forEach(feature => feature.properties = {
          ...feature.properties,
          ...options,
        });
        flagColor = options.color;
      }
      else {
        flagColor = getFlagColor(geojsonData);
      }
      const stringData = JSON.stringify(geojsonData);
      await fs.writeFile(absGeojsonPath, stringData);
      try { await fs.rm(absLayerPath); } catch { };
      return { geojsonPath, size: stringData.length / (1024 * 1024), featureCount: geojsonData.features.length, flagColor };
    }
  } catch { return undefined; }
}
