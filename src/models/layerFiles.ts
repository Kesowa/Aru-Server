import mongoose from "mongoose";
import layerFilesSchema, { ILayerFile, LayerFileModel } from "../schemas/layerFiles";

const layerFiles = mongoose.model<ILayerFile, LayerFileModel>("layerFiles", layerFilesSchema);
export default layerFiles;
