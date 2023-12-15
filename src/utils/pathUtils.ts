import path from "path";
import { PUBLIC_DIR } from "../constants";

/**
 * Relative path within Public folder (Directory + File path)
 */
export type DirPath = string;

/**
 * Path for use within MongoBD documents (/ + relative path)
 */
export type DocPath = string;

/**
 * All folders and subfolders in use
 */
export enum Directory {
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
  DEFAULT = "",
  ROOT = "/",
}

/**
 * Get file path for use in MongoDB documents and URL
 */
export const docPath = (dir: Directory, filename: string): DocPath =>
  path.join("/", dir, filename);

/**
 * Get relative path from Public directory, or for use as S3 object key
 */
export const relPath = (dir: Directory, filename: string): DirPath => {
  filename = filename.replace(/^\//, "");
  return path.join(dir, filename);
};

/**
 * Get absolute path to file on system
 */
export const absPath = (dir: Directory, filename: string) =>
  path.join(PUBLIC_DIR, dir, filename);
