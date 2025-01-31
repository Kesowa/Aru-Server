import mongoose from "mongoose";
import layerSchema, { ILayer, LayerModel } from "../schemas/layer";

const layer = mongoose.model<ILayer, LayerModel>("layer", layerSchema);
export default layer;
