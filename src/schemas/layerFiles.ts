import mongoose from "mongoose";
import Layer from "../models/layer";
import Tenant from "../models/tenant";
import { Types } from "ts-openapi";

export interface ILayerFile {
  _id: mongoose.Types.ObjectId;
  name: string;
  layerId: mongoose.Types.ObjectId; // index
  layers: mongoose.Types.ObjectId[]; // index // REVISIT
  sys_Id?: string; // index
  featureLabel?: string;
  centerPoints?: { lng: number; lat: number };
  coverPhoto: boolean;
  filePath: string;
  fileType: string;
  tenantId: mongoose.Types.ObjectId; // index
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  isReview: boolean; // index
  isThreadExist: boolean;
  commentCount: Number;
  fileSize: number;
  createdAt: Date;
  updatedAt: Date;
}
export const LayerFileType = {
  _id: Types.String(),
  name: Types.String(),
  layerId: Types.String(), // index
  layers: Types.Array({ arrayType: Types.String() }), // index // REVISIT
  sys_Id: Types.String(), // index
  featureLabel: Types.String(),
  centerPoints: Types.Object({
    properties: { lng: Types.Number(), lat: Types.Number() },
  }),
  coverPhoto: Types.Boolean(),
  filePath: Types.String(),
  fileType: Types.String(),
  tenantId: Types.String(), // index
  createdBy: Types.String(),
  updatedBy: Types.String(),
  isReview: Types.Boolean(), // index
  fileSize: Types.Number(),
  createdAt: Types.DateTime(),
  updatedAt: Types.DateTime(),
};
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
      lng: Number,
      lat: Number,
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
    isThreadExist: {
      type: Boolean,
      default: false,
    },
    commentCount: {
      type: Number,
      default: 0,
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
    { $inc: { actualSize: this.fileSize, allLayerFileSize: this.fileSize } }
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
      { $inc: { actualSize: -this.fileSize, allLayerFileSize: -this.fileSize } }
    );
    await Layer.updateOne(
      { _id: this.layerId },
      { $inc: { fileSize: -this.fileSize } }
    );
  }
);
export default layerFilesSchema;
