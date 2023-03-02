import mongoose from "mongoose";
import layerGroupSchema, { ILayerGroup } from "../schemas/layerGroup";

const layerGroupModel = mongoose.model<ILayerGroup>(
  "layerGroup",
  layerGroupSchema
);

export default layerGroupModel;
