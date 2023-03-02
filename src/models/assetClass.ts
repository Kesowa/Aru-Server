import { model } from "mongoose";
import assetClassSchema, { IAssetClass } from "../schemas/assetClass";

const assetClass = model<IAssetClass>("assetClass", assetClassSchema);

export default assetClass;
