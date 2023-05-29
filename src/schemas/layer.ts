import mongoose from "mongoose";
import Mission from "../models/mission";
import Tenant from "../models/tenant";
export interface ILayer {
  _id: mongoose.Types.ObjectId;
  type: "Vector" | "Raster"; // index
  raster: mongoose.Types.ObjectId;
  vector: mongoose.Types.ObjectId;
  missionId: mongoose.Types.ObjectId; // index
  tenantId: mongoose.Types.ObjectId; // index
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  layerGroupId: mongoose.Types.ObjectId;
  captureDate: Date;
  color: string;
  layerpath: string;
  name: string;
  layerdataArr: [{}];
  //here why arent we creating an array
  center: [{}];
  minp: number;
  maxp: number;
  featureCount: number;
  layers?: mongoose.Types.ObjectId[];
  layerLabel?: string;
  layerPopupLabel?: string;
  isPublic: boolean; // index
  publicMapRef?: string;
  isBase: boolean;
  fileSize: number;
  flaggedFeatures: number[];
  isFlagged: boolean;
  isThreadExist: boolean;
  commentCount: Number;
  createdAt: Date; // index
  updatedAt: Date;
}
const layerSchema = new mongoose.Schema<ILayer>(
  {
    name: {
      type: String,
    },
    type: {
      type: String,
      enum: ["Vector", "Raster"],
    },
    raster: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "raster",
    },
    vector: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "vector",
    },
    layerpath: {
      type: String,
    },
    layerdataArr: {
      type: [{}],
    },
    color: {
      type: String,
    },
    minp: {
      type: Number,
    },
    maxp: {
      type: Number,
    },
    featureCount: {
      type: Number,
    },
    layers: {
      type: [mongoose.Schema.Types.ObjectId],
      required: false,
    },
    layerLabel: {
      type: String,
      require: false,
    },
    layerPopupLabel: {
      type: String,
      require: false,
    },
    isPublic: {
      type: Boolean,
      default: false,
      require: true,
    },
    publicMapRef: {
      type: String,
    },
    isBase: {
      type: Boolean,
      default: false,
      require: true,
    },
    center: {
      type: [{}],
    },
    fileSize: {
      type: Number,
      required: true,
    },
    captureDate: {
      type: Date,
    },
    missionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "mission",
    },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tenant",
    },
    layerGroupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "layerGroup",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
    },
    flaggedFeatures: {
      type: [Number],
      required: true,
      default: [],
    },
    isFlagged: {
      type: Boolean,
      required: true,
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
layerSchema.index({
  missionId: 1,
  tenantId: 1,
  createdAt: 1,
  type: 1,
  isPublic: 1,
});
layerSchema.pre("save", async function () {
  await Tenant.updateOne(
    { _id: this.tenantId },
    { $inc: { actualSize: this.fileSize, allLayerSize: this.fileSize } }
  );
  await Mission.updateOne(
    { _id: this.missionId },
    { $inc: { size: this.fileSize } }
  );
});
layerSchema.post(
  "remove",
  async function (this: {
    tenantId: mongoose.Types.ObjectId;
    missionId: mongoose.Types.ObjectId;
    fileSize: number;
  }) {
    await Tenant.updateOne(
      { _id: this.tenantId },
      { $inc: { actualSize: -this.fileSize, allLayerSize: -this.fileSize } }
    );
    await Mission.updateOne(
      { _id: this.missionId },
      { $inc: { size: -this.fileSize } }
    );
  }
);
export default layerSchema;
