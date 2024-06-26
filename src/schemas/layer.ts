import mongoose from "mongoose";
import Mission from "../models/mission";
import Tenant from "../models/tenant";
import { Types } from "ts-openapi";
import { rasterProps } from "./rasterprops";
import { vectorProps } from "./vectorprops";
export interface ILayer {
  _id: mongoose.Types.ObjectId;
  type: "Vector" | "Raster"; // index
  raster: rasterProps;
  vector: vectorProps;
  missionId: mongoose.Types.ObjectId; // index
  tenantId: mongoose.Types.ObjectId; // index
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  layerGroupId: mongoose.Types.ObjectId;
  captureDate: Date;
  color: string;
  layerpath: string;
  name: string;
  layerdataArr: [{}]; // stored minp/maxp for baselayers and being used on frontend
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
  commentCount: number;
  createdAt: Date; // index
  updatedAt: Date;
  metadata?: string | Object;
}
export const LayerType = {
  _id: Types.String(),
  type: Types.StringEnum({ values: ["Vector", "Raster"] }), // index
  raster: Types.StringEnum({ values: Object.values(rasterProps) }),
  vector: Types.StringEnum({ values: Object.values(vectorProps) }),
  missionId: Types.String(), // index
  tenantId: Types.String(), // index
  createdBy: Types.String(),
  updatedBy: Types.String(),
  layerGroupId: Types.String(),
  captureDate: Types.DateTime(),
  color: Types.String(),
  layerpath: Types.String(),
  name: Types.String(),
  layerdataArr: Types.Array({ arrayType: Types.Object({ properties: {} }) }),
  center: Types.Object({
    properties: { lng: Types.Number(), lat: Types.Number() },
  }),
  minp: Types.Number(),
  maxp: Types.Number(),
  featureCount: Types.Number(),
  layers: Types.Array({ arrayType: Types.String() }),
  layerLabel: Types.String(),
  isPublic: Types.Boolean(), // index
  publicMapRef: Types.String(),
  isBase: Types.Boolean(),
  fileSize: Types.Number(),
  flaggedFeatures: Types.Array({ arrayType: Types.Number() }),
  isFlagged: Types.Boolean(),
  createdAt: Types.DateTime(), // index
  updatedAt: Types.DateTime(),
  metadata: Types.Object({
    properties: {},
  }),
};
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
      type: String,
      enum: Object.values(rasterProps)
    },
    vector: {
      type: String,
      enum: Object.values(vectorProps)
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
      lng: {
        type: Number,
      },
      lat: {
        type: Number,
      },
      required: false,
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
      ref: "user",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
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
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      required: false,
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
