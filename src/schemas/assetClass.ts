import mongoose from "mongoose";
export interface IAssetClass {
  _id: mongoose.Types.ObjectId;
  typeName: string;
  createdAt: Date;
  createdBy: mongoose.Types.ObjectId;
}
const assetClassSchema = new mongoose.Schema<IAssetClass>({
  typeName: String,
  createdAt: Date,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
  },
});
export default assetClassSchema;
