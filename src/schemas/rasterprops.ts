import mongoose from "mongoose";
import { Types } from "ts-openapi";

export interface IRaster {
  _id: mongoose.Types.ObjectId;
  name: "ORTHO" | "DEM" | "NDVI" | "DTM" | "NDWI";
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
  name: Types.StringEnum({ values: ["ORTHO", "DEM", "NDVI", "DTM", "NDWI"] }),
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
      enum: ["ORTHO", "DEM", "NDVI", "DTM", "NDWI"],
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
