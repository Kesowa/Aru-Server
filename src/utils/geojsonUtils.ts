import Layer from "../models/layer";

import { ObjectId } from "bson";
import { Directory } from "../constants";
import { readToString } from "./objectStorage";
import { saveFile } from "./dataUtils";
import { parse } from "path";
import { randomUUID } from "crypto";

type Properties = {
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

export interface Feature<Geometry, Property> {
  type: "Feature";
  properties: Property;
  geometry: Geometry;
}

export type Point = {
  type: "Point";
  coordinates: [number, number];
};

// Default is a point feature with a load of properties
export interface GeoJson<FeatureType = Feature<Point, Properties>> {
  type: string;
  name: string;
  features: FeatureType[];
}

export async function readGeoJson<Feature>(fullpath: string) {
  try {
    const data = await readToString(fullpath);
    const geojson = JSON.parse(data) as GeoJson<Feature>;
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
  pathh: string
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
  const newPath = parse(pathh).dir + randomUUID() + ".geojson";
  const { filepath, size } = await saveFile(
    Directory.ROOT,
    newPath,
    JSON.stringify(geojson)
  );
  return { filepath, size: size / (1024 * 1024) };
}

export async function featureAddition(
  pathh: string,
  editObject: any,
  geojson: GeoJson
) {
  const sys_id = new ObjectId();
  for (const key of Object.keys(editObject.feature.properties)) {
    const floated = parseFloat(editObject.feature.properties[key]);
    if (!isNaN(floated)) {
      editObject.feature.properties[key] = floated;
    }
  }
  Object.assign(editObject.feature.properties, { sys_id: sys_id });
  geojson.features.push(editObject.feature);
  const newPath = parse(pathh).dir + randomUUID() + ".geojson";
  const { filepath, size } = await saveFile(
    Directory.ROOT,
    newPath,
    JSON.stringify(geojson)
  );
  await Layer.updateOne(
    { _id: editObject.id },
    { featureCount: geojson.features.length }
  );
  return { filepath, size: size / (1024 * 1024) };
}

export async function editGeoJsonForAll(
  pathh: string,
  editObject: any,
  geojson: GeoJson
) {
  delete editObject.feature.geometry;
  delete editObject.feature.properties.Id;
  Object.assign(
    geojson.features[editObject.featureIndex].properties,
    editObject.feature.properties
  );
  const newPath = parse(pathh).dir + "/" + randomUUID() + ".geojson";
  const { filepath, size } = await saveFile(
    Directory.ROOT,
    newPath,
    JSON.stringify(geojson)
  );
  return { filepath, size: size / (1024 * 1024) };
}

export async function deleteGeoJsonFeature(
  pathh: string,
  deleteObject: any,
  geojson: GeoJson
) {
  geojson.features.splice(deleteObject.featureIndex, 1);
  const newPath = parse(pathh).dir + randomUUID() + ".geojson";
  const { filepath, size } = await saveFile(
    Directory.ROOT,
    newPath,
    JSON.stringify(geojson)
  );
  await Layer.updateOne(
    { _id: deleteObject.id },
    { featureCount: geojson.features.length }
  );
  return { filepath, size: size / (1024 * 1024) };
}
