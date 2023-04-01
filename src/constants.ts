import { existsSync } from "fs";
import { Types } from "mongoose";
import path from "path";

export const DUMMY_TENANT = new Types.ObjectId("629aeb50ea5ed2cee054870b");

const checkEnum = (e: Record<string, string>) => (val: string) =>
  Object.values(e).includes(val);
const castEnum = <T>(val: string) => val as unknown as T;
const checkUrl = (val: string) => {
  if (val.endsWith("/")) {
    new URL(val);
    return false;
  }
  return true;
};
const castUrl = (val: string) => new URL(val);

class EnvVar {
  key: string;
  val: string;
  constructor(key: string) {
    this.key = key;
    let val = undefined;
    if (val == undefined) val = process.env[key];
    if (val == undefined || val.length == 0) throw new EnvError(key, val);
    this.val = val;
  }
  isUrl() {
    return this.check(checkUrl);
  }
  isEnum(e: Record<string, string>) {
    return this.check(checkEnum(e));
  }
  toUrl() {
    return this.cast(castUrl);
  }
  toEnum<T>() {
    return this.cast<T>(castEnum);
  }
  toString() {
    return this.cast(String);
  }
  toNumeric() {
    return this.cast(Number);
  }
  check(fn: (val: string) => boolean) {
    try {
      if (fn(this.val)) return this;
      else throw new CheckError(this.key, this.val);
    } catch (err) {
      console.group("CheckError");
      console.error(err);
      console.groupEnd();
      throw new CheckError(this.key, this.val);
    }
  }
  cast<T>(op: (val: string) => T) {
    try {
      return op(this.val);
    } catch (error) {
      console.group("CheckError");
      console.error(error);
      console.groupEnd();
      throw new CastError(this.key, this.val);
    }
  }
}

class EnvError extends Error {
  constructor(key: string, val: undefined | string) {
    super();
    this.message = `No value ${val} found for key ${key}`;
  }
}
class CheckError extends Error {
  constructor(key: string, val: undefined | string) {
    super();
    this.message = `Invalid value ${val} for key ${key}`;
  }
}
class CastError extends Error {
  constructor(key: string, val: undefined | string) {
    super();
    this.message = `Unable to convert value ${val} for key ${key}`;
  }
}
export const PORT = new EnvVar("PORT").toNumeric();
export const MONGODB_CONNECTION_STRING = new EnvVar("MONGODB_CONNECTION_STRING")
  .isUrl()
  .toString();
export const SMTP_PASSWORD = new EnvVar("SMTP_PASSWORD").toString();
export const SMTP_USERNAME = new EnvVar("SMTP_USERNAME").toString();
export const SMTP_SERVER = new EnvVar("SMTP_SERVER").isUrl().toString();
export const SMTP_PORT = new EnvVar("SMTP_PORT").toNumeric();
export const MAP_KEY = new EnvVar("MAP_KEY").toString();
export const API_SERVER = new EnvVar("API_SERVER").isUrl().toString();
export const PUBLIC_SERVER = new EnvVar("PUBLIC_SERVER").isUrl().toString();
export const CDN_URL = new EnvVar("CDN_URL").isUrl().toString();
export const FTP_PORT = new EnvVar("FTP_PORT").toNumeric();
export const FTP_HOST_DEV = new EnvVar("FTP_HOST_DEV").toString();
export const FTP_HOST_PROD = new EnvVar("FTP_HOST_PROD").toString();
export const FTP_USERNAME = new EnvVar("FTP_USERNAME").toString();
export const FTP_PASSWORD = new EnvVar("FTP_PASSWORD").toString();
export const RESET_PASSWORD_TOKEN_EXPIRE = new EnvVar(
  "RESET_PASSWORD_TOKEN_EXPIRE"
).toNumeric();
export const SECRET_KEY = new EnvVar("SECRET_KEY").toString();

export enum Instance {
  ARU = "aru",
  NKDA = "nkda",
  AWS = "aws",
}
export const ARU_INSTANCE = new EnvVar("ARU_INSTANCE")
  .isEnum(Instance)
  .toEnum<Instance>();
export const LIVE_URL = new EnvVar("LIVE_URL").isUrl().toString();
export const PUBLIC_DIR = new EnvVar("PUBLIC_DIR")
  .check(existsSync)
  .toString();
export const TITILER_SERVER = new EnvVar("TITILER_SERVER").isUrl().toString();
export const TITILER_STATIC = new EnvVar("TITILER_STATIC").isUrl().toString();
export const RAZORPAY_KEY_ID = new EnvVar("RAZORPAY_KEY_ID").toString();
export const RAZORPAY_KEY_SECRET = new EnvVar("RAZORPAY_KEY_SECRET").toString();
export const RAZORPAY_HOOK_SECRET = new EnvVar(
  "RAZORPAY_HOOK_SECRET"
).toString();

export enum Mode {
  Prod = "production",
  Dev = "development",
  Test = "testing",
}
export const MODE = new EnvVar("MODE").isEnum(Mode).toEnum<Mode>();

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
}

export const DirPath = (dir: Directory, filename?: string | undefined) =>
  filename == undefined
    ? path.join(PUBLIC_DIR, dir)
    : path.join(PUBLIC_DIR, dir, filename);

export const TITILER_PUBLIC = new EnvVar("TITILER_PUBLIC").isUrl().toString();
export const RTMP_PUBLIC = new EnvVar("RTMP_PUBLIC").isUrl().toString();
export const REDIS_URI = new EnvVar("REDIS_URI").isUrl().toString();
export const SEQ_SERVER_URL = new EnvVar("SEQ_URL").isUrl().toString();
export const SEQ_API_KEY = new EnvVar("SEQ_KEY").toString();

export const AIML_SERVER = new EnvVar("AIML_SERVER").isUrl().toString();
