import mongoose from "mongoose";

import assetSchema, { IAsset } from "../schemas/asset";

const Asset = mongoose.model<IAsset>("asset", assetSchema);

export default Asset;
