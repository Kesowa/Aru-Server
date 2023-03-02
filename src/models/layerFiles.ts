import mongoose from "mongoose";
import layerFilesSchema, { ILayerFile } from "../schemas/layerFiles";

const layerFiles = mongoose.model<ILayerFile>("layerFiles", layerFilesSchema);
export default layerFiles;
