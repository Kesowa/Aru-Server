import path from "path";

export const absPath = (_dir: Directory, _filename: string) => "";

/**
 * Object key (no / at start)
 */
export type KeyPath = string;

/**
 * Path for use within MongoBD documents (/ + relative path)
 */
export type DocPath = string;

/**
 * All folders and subfolders in use
 */
export enum Directory {
  POINT_CLOUD = "raster",
  CESIUM_3D = "raster",
  CSV = "csv",
  DOCUMENTS = "documents",
  FLIGHT_LOGS = "flight_logs",
  ALERT_IMAGES = "images/alertImages",
  GEOJSON_IMAGES = "images/geojson",
  PACKAGE_POSTERS = "images/packagePosters",
  TEMP_IMAGES = "images/temp",
  USER_AVATARS = "images/userAvatars",
  TENANT_LOGOS = "images/tenantLogos",
  LAYER_FILES = "layerFiles",
  RASTER = "raster",
  TEMP = "temp",
  VECTOR = "vector",
  ZIP = "zip",
  VOD = "vod",
  ICON = "icons",
  IMAGE = "images",
  AI_ML = "aiml",
  ROOT = "/",
  DEFAULT = "",
}

export const DocToDir = <const> {
  "VOD": Directory.VOD,
  "user": Directory.USER_AVATARS,
  "alert": Directory.ALERT_IMAGES,
  "vector": Directory.VECTOR,
  "raster": Directory.RASTER,
  "document": Directory.DOCUMENTS,
  "layerFiles": Directory.LAYER_FILES,
};

/**
 * Get file path for use in MongoDB documents and URL
 */
export const docPath = (dir: Directory, filename: string): DocPath =>
  path.join("/", dir, filename);

/**
 * Get relative path from Public directory, or for use as S3 object key
 */
export const keyPath = (filename: string): KeyPath => {
  filename = filename.replace(/^\//, "");
  return filename;
};
