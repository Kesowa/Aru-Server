import mongoose from "mongoose";
import { Types } from "ts-openapi";

export interface IVector {
  _id: mongoose.Types.ObjectId;
  name: string;
  type: "Point" | "MultiLineString" | "MultiPolygon";
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
export const VectorType = {
  _id: Types.String(),
  name: Types.String(),
  type: Types.StringEnum({ values: ["Point","MultiLineString","MultiPolygon"] }),
  createdBy: Types.String(),
  updatedBy: Types.String(),
  createdAt: Types.DateTime(),
  updatedAt: Types.DateTime()
}
const vectorSchema = new mongoose.Schema<IVector>(
  {
    name: {
      type: String,
    },
    type: {
      type: String,
      enum: ["Point", "MultiLineString", "MultiPolygon"],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
    },
  },
  {
    timestamps: true,
  }
);
export default vectorSchema;
