import mongoose from "mongoose";
import layerSchema, { ILayer } from "../schemas/layer";

const layer = mongoose.model<ILayer>("layer", layerSchema);
export default layer;
