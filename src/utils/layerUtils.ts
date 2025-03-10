import { Types } from "mongoose";

import { saveVectorLayer } from "./dataUtils";
import { GeoJson } from "./geojsonUtils";
import { deleteObj, readToString } from "./objectStorage";
import layerModel from "../models/layer";
import layerGroupModel from "../models/layerGroup";
import { vectorProps } from "../schemas/vectorprops";


type createMixedLayerGroupInput = {
  name: string;
  missionId?: Types.ObjectId;
  tenantId: Types.ObjectId;
  userId: Types.ObjectId;
  geojson: string;
  featureTypes: string[];
  captureDate: Date;
};

const vectorPropMap = {
  Point: vectorProps.LANDMARK,
  Polygon: vectorProps.AREA_BOUNDARY,
  LineString: vectorProps.BOUNDARY_WALL,
  MultiPoint: vectorProps.LANDMARK,
  MultiPolygon: vectorProps.AREA_BOUNDARY,
  MultiLineString: vectorProps.BOUNDARY_WALL,
};

export const createMixedLayerGroup = async (
  input: createMixedLayerGroupInput
) => {
  const geojsonData = JSON.parse(await readToString(input.geojson)) as GeoJson;
  const featureLayers = new Map(
    input.featureTypes.map((ft) => [
      ft,
      {
        type: "FeatureCollection",
        name: input.name,
        crs: {
          type: "name",
          properties: {
            name: "urn:ogc:def:crs:OGC:1.3:CRS84",
          },
        },
        features: [],
      },
    ])
  );
  for (const feature of geojsonData.features) {
    if (feature.properties["stroke"])
      feature.properties.color = feature.properties["stroke"];
    featureLayers.get(feature.geometry.type).features.push(feature);
  }
  const layerGroup = await layerGroupModel.create({
    name: input.name,
    createdBy: input.userId,
    tenantId: input.tenantId,
    layers: [],
  });
  const layerPromises = Array.from(featureLayers.entries()).map(
    async ([layerType, layer]) => {
      const vectorLayer = await saveVectorLayer(
        layer,
        layerType == "Point"
          ? { inheritColor: true, icon: "MarkerIcon" }
          : { inheritColor: true }
      );
      const layerDoc = await layerModel.create({
        name: input.name,
        type: "Vector",
        vector: vectorPropMap[layerType],
        color: vectorLayer.flagColor,
        layerpath: vectorLayer.geojsonPath,
        fileSize: vectorLayer.size,
        featureCount: vectorLayer.featureCount,
        layerGroupId: layerGroup._id,
        captureDate: input.captureDate,
        missionId: input.missionId,
        tenantId: input.tenantId,
        createdBy: input.userId,
        updatedBy: input.userId,
      });
      await layerGroup.updateOne({ $addToSet: { layers: layerDoc._id } });
      return layerDoc;
    }
  );
  const layers = await Promise.all(layerPromises);
  await deleteObj(input.geojson);
  return layers;
};
