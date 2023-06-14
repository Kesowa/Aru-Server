import mongoose from "mongoose";
import { Types } from "ts-openapi";

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

export const ModelType = {
  _id: Types.String(),
  modelName: Types.String(),
  modelNumber: Types.String(),
  assetClassID: Types.String(),
  dimensions: Types.Object({
    properties: {
      length: Types.Number(),
      breadth: Types.Number(),
      height: Types.Number(),
    },
  }),
  manufacturerID: Types.String(),
  website: Types.String(),
  createdBy: Types.String(),
  tenantID: Types.String(), // index
  props: Types.Object({ properties: {} }),
  createdAt: Types.DateTime(),
  updatedAt: Types.DateTime(),
};

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
