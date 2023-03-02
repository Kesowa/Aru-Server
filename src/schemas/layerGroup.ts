import mongoose from "mongoose";
export interface ILayerGroup {
  _id: mongoose.Types.ObjectId;
  name: string;
  layers: mongoose.Types.ObjectId[]; // index
  createdBy: mongoose.Types.ObjectId;
  tenantId: mongoose.Types.ObjectId; // index
  createdAt: Date;
  updatedAt: Date;
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
