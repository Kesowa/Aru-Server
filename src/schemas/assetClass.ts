import mongoose from "mongoose";
import { Types } from "ts-openapi";

export interface IAssetClass {
  _id: mongoose.Types.ObjectId;
  typeName: string;
  createdAt: Date;
  createdBy: mongoose.Types.ObjectId;
}
export const AssetClassType = {
  _id: Types.String(),
  typeName: Types.String(),
  createdAt: Types.DateTime(),
  createdBy: Types.String(),
};
const assetClassSchema = new mongoose.Schema<IAssetClass>({
  typeName: String,
  createdAt: Date,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
  },
});
export default assetClassSchema;
