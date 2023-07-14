import { Logger } from "pino";
import { Directory, DirPath } from "../constants";
import Layer from "../models/layer";
import s3fs from "../s3utils/lib-aws";

import { ObjectId } from "bson";

export interface GeoJson {
  type: string;
  name: string;
  crs: {
    type: string;
    properties: {
      name: string;
    };
  };
  features: Feature[];
  errno: number;
}

export interface Feature {
  type: "Feature";
  properties: {
    SL_NO: number;
    AA: string;
    Solar_ID: string;
    Placed_IN: string;
    Latitude: number;
    Longitude: number;
    DoC: string;
    Phase: string;
    color: string;
    icon: string;
    sys_id: string;
    Nth: Record<string, string | number>;
  };
  geometry: Point;
}

interface Point {
  type: "Point";
  coordinates: [number, number];
}

export async function readGeoJson(fullpath: string) {
  try {
    const data = (
      await s3fs.readFile(DirPath(Directory.DEFAULT, fullpath))
    ).toString();
    const geojson = JSON.parse(data) as GeoJson;
    return geojson;
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function modGeoJson(
  icon: string,
  color: string,
  geojson: GeoJson,
  pathh: string,
  log?: Logger
) {
  if (color && icon) {
    for (let i = 0; i < geojson.features.length; i++) {
      const sys_id = new ObjectId();
      Object.assign(geojson.features[i].properties, {
        color: color,
        icon: icon,
        sys_id: sys_id.toHexString(),
      });
    }
  } else if (color) {
    for (let i = 0; i < geojson.features.length; i++) {
      const sys_id = new ObjectId();
      Object.assign(geojson.features[i].properties, {
        color: color,
        sys_id: sys_id.toHexString(),
      });
    }
  } else if (icon) {
    for (let i = 0; i < geojson.features.length; i++) {
      const sys_id = new ObjectId();
      Object.assign(geojson.features[i].properties, {
        icon: icon,
        sys_id: sys_id.toHexString(),
      });
    }
  } else {
    for (let i = 0; i < geojson.features.length; i++) {
      const sys_id = new ObjectId();
      Object.assign(geojson.features[i].properties, {
        sys_id: sys_id.toHexString(),
      });
    }
  }
  try {
    await s3fs.writeFile(pathh, JSON.stringify(geojson));
    await s3fs.updateFile(pathh);
    return 1;
  } catch (error) {
    log ? log.error(error) : console.log(error);
    return 0;
  }
}

export async function featureAddition(
  pathh: string,
  editObject: any,
  geojson: GeoJson
) {
  try {
    const sys_id = new ObjectId();
    for (const key of Object.keys(editObject.feature.properties)) {
      const floated = parseFloat(editObject.feature.properties[key]);
      if (!isNaN(floated)) {
        editObject.feature.properties[key] = floated;
      }
    }
    Object.assign(editObject.feature.properties, { sys_id: sys_id });
    geojson.features.push(editObject.feature);

    await s3fs.writeFile(
      DirPath(Directory.DEFAULT, pathh),
      JSON.stringify(geojson)
    );
    await s3fs.updateFile(DirPath(Directory.DEFAULT, pathh));
    await Layer.updateOne(
      { _id: editObject.id },
      { featureCount: geojson.features.length }
    );
    return 1;
  } catch (error) {
    console.error(error);
    return 0;
  }
}

export async function editGeoJsonForAll(
  pathh: string,
  editObject: any,
  geojson: GeoJson
) {
  try {
    delete editObject.feature.geometry;
    delete editObject.feature.properties.Id;
    Object.assign(
      geojson.features[editObject.featureIndex].properties,
      editObject.feature.properties
    );
    await s3fs.writeFile(
      DirPath(Directory.DEFAULT, pathh),
      JSON.stringify(geojson)
    );
    await s3fs.updateFile(DirPath(Directory.DEFAULT, pathh));
    return true;
  } catch (error) {
    console.error(error);
  }
}

export async function deleteGeoJsonFeature(
  pathh: string,
  deleteObject: any,
  geojson: GeoJson
) {
  try {
    geojson.features.splice(deleteObject.featureIndex, 1);
    await s3fs.writeFile(
      DirPath(Directory.DEFAULT, pathh),
      JSON.stringify(geojson)
    );
    await s3fs.updateFile(DirPath(Directory.DEFAULT, pathh));
    await Layer.updateOne(
      { _id: deleteObject.id },
      { featureCount: geojson.features.length }
    );
    return true;
  } catch (error) {
    console.error(error);
  }
}
