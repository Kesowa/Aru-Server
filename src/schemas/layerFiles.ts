import mongoose from "mongoose";
import Layer from "../models/layer";
import Tenant from "../models/tenant";
export interface ILayerFile {
  _id: mongoose.Types.ObjectId;
  name: string;
  layerId: mongoose.Types.ObjectId; // index
  layers: mongoose.Types.ObjectId[]; // index // REVISIT
  sys_Id?: string; // index
  featureLabel?: string;
  centerPoints?: { lat: number; lng: number };
  coverPhoto: boolean;
  filePath: string;
  fileType: string;
  tenantId: mongoose.Types.ObjectId; // index
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  isReview: boolean; // index
  fileSize: number;
  createdAt: Date;
  updatedAt: Date;
}
const layerFilesSchema = new mongoose.Schema<ILayerFile>(
  {
    name: {
      type: String,
    },
    layerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "layers",
    },
    layers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "layers",
      },
    ],
    sys_Id: {
      type: String,
      required: false,
    },
    featureLabel: {
      type: String,
      required: false,
    },
    coverPhoto: Boolean,
    fileSize: {
      type: Number,
    },
    centerPoints: {
      lat: Number,
      lng: Number,
      required: false,
    },
    filePath: {
      type: String,
    },
    fileType: {
      type: String,
      require: true,
    },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tenant",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
    },
    isReview: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);
layerFilesSchema.index({
  layerId: 1,
  tenantId: 1,
  isReview: 1,
});
layerFilesSchema.index({ sys_Id: 1 }, { sparse: true });
layerFilesSchema.pre("save", async function () {
  await Tenant.updateOne(
    { _id: this.tenantId },
    { $inc: { actualSize: this.fileSize } }
  );
  await Layer.updateOne(
    { _id: this.layerId },
    { $inc: { fileSize: this.fileSize } }
  );
});
layerFilesSchema.post(
  "remove",
  async function (this: {
    tenantId: mongoose.Types.ObjectId;
    fileSize: number;
    layerId: mongoose.Types.ObjectId;
  }) {
    await Tenant.updateOne(
      { _id: this.tenantId },
      { $inc: { actualSize: -this.fileSize } }
    );
    await Layer.updateOne(
      { _id: this.layerId },
      { $inc: { fileSize: -this.fileSize } }
    );
  }
);
export default layerFilesSchema;
