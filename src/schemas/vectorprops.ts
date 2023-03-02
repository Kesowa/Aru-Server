import mongoose from "mongoose";
export interface IVector {
  _id: mongoose.Types.ObjectId;
  name: string;
  type: "Point" | "MultiLineString" | "MultiPolygon";
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
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
