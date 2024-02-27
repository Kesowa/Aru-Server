import mongoose from "mongoose";
import { Types } from "ts-openapi";

const NAMES = <const>["ORTHO", "DEM", "NDVI", "DTM", "NDWI", "POINT_CLOUD"];

export interface IRaster {
  _id: mongoose.Types.ObjectId;
  name: typeof NAMES[number];
  bidx?: string;
  bandExp?: string;
  colorMap?: string;
  resamplingMethod?: string;
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export const RasterType = {
  _id: Types.String(),
  name: Types.StringEnum({ values: [...NAMES]}),
  bidx: Types.String(),
  bandExp: Types.String(),
  colorMap: Types.String(),
  resamplingMethod: Types.String(),
  createdBy: Types.String(),
  updatedBy: Types.String(),
  createdAt: Types.DateTime(),
  updatedAt: Types.DateTime(),
};

const rasterSchema = new mongoose.Schema<IRaster>(
  {
    name: {
      type: String,
      enum: NAMES,
    },
    bidx: {
      type: String,
      required: false,
    },
    bandExp: {
      type: String,
      required: false,
    },
    colorMap: {
      type: String,
      required: false,
    },
    resamplingMethod: {
      type: String,
      required: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
    },
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
export default rasterSchema;
