import layerGroupModel from "../models/layerGroup";
import layerModel from "../models/layer";
import { saveVectorLayer } from "./dataUtils";
import { GeoJson } from "./geojsonUtils";
import { deleteObj, readToString } from "./objectStorage";
import { vectorProps } from "../schemas/vectorprops";
import { Types } from "mongoose";

type createMixedLayerGroupInput = {
  name: string,
  missionId?: Types.ObjectId,
  tenantId: Types.ObjectId,
  userId: Types.ObjectId,
  geojson: string,
  featureTypes: string[],
  captureDate: Date,
}

const vectorPropMap = {
  "Point": vectorProps.LANDMARK,
  "Polygon": vectorProps.AREA_BOUNDARY,
  "LineString": vectorProps.BOUNDARY_WALL,
  "MultiPoint": vectorProps.LANDMARK,
  "MultiPolygon": vectorProps.AREA_BOUNDARY,
  "MultiLineString": vectorProps.BOUNDARY_WALL,
}

export const createMixedLayerGroup = async (input: createMixedLayerGroupInput) => {
  const geojsonData = JSON.parse(await readToString(input.geojson)) as GeoJson;
  const featureLayers = new Map(
    input.featureTypes.map(ft =>
      [ft, { type: ft, name: input.name, features: [], }]
    )
  );
  geojsonData.features.forEach(f => featureLayers.get(f.type)?.features.push(f));
  const layerGroup = await layerGroupModel.create({
    name: input.name,
    createdBy: input.userId,
    tenantId: input.tenantId,
    layers: []
  });
  const layerPromises = Array.from(featureLayers.values())
    .map(async layer => {
       const vectorLayer = await saveVectorLayer(layer, { inheritColor: true });
       const layerDoc = await layerModel.create({
         name: input.name,
         type: "Vector",
         vector: vectorPropMap[layer.type],
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
       await layerGroup.updateOne({ $addToSet: { layers: layerDoc._id }});
       return layerDoc;
    });
    const layers = await Promise.all(layerPromises);
    await deleteObj(input.geojson);
    return layers;
}
