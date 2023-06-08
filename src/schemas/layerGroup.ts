import mongoose from "mongoose";
import { Types } from "ts-openapi";

export interface ILayerGroup {
  _id: mongoose.Types.ObjectId;
  name: string;
  layers: mongoose.Types.ObjectId[]; // index
  createdBy: mongoose.Types.ObjectId;
  tenantId: mongoose.Types.ObjectId; // index
  createdAt: Date;
  updatedAt: Date;
}
export const LayerGroupType = {
  _id: Types.String(),
  name: Types.String(),
  layers: Types.Array({ arrayType: Types.String() }), // index
  createdBy: Types.String(),
  tenantId: Types.String(), // index
  createdAt: Types.DateTime(),
  updatedAt: Types.DateTime(),
}
const layerGroupSchema = new mongoose.Schema<ILayerGroup>(
  {
    name: {
      type: String,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "user",
    },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tenant",
      required: true,
    },
    layers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "layer",
      },
    ],
  },
  { timestamps: true }
);
layerGroupSchema.index({
  layers: 1,
  tenantId: 1,
});
export default layerGroupSchema;
