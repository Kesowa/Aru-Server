import mongoose from "mongoose";
export interface IModel {
  _id: mongoose.Types.ObjectId;
  modelName: string;
  modelNumber: string;
  assetClassID: mongoose.Types.ObjectId;
  dimensions: {
    length: number;
    breadth: number;
    height: number;
  };
  manufacturerID: mongoose.Types.ObjectId;
  website: string;
  createdBy: mongoose.Types.ObjectId;
  tenantID: mongoose.Types.ObjectId; // index
  props: {};
  createdAt: Date;
  updatedAt: Date;
}
const modelSchema = new mongoose.Schema<IModel>(
  {
    modelName: {
      type: String,
      required: true,
    },
    modelNumber: {
      type: String,
    },
    assetClassID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "assetClass",
      required: true,
    },
    dimensions: {
      length: Number,
      breadth: Number,
      height: Number,
    },
    manufacturerID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "manufacturer",
      required: true,
    },
    website: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    tenantID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tenant",
      required: true,
    },
    props: {},
    createdAt: {
      type: Date,
    },
    updatedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);
modelSchema.index({
  tenantID: 1,
});
export default modelSchema;
