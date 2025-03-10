import mongoose from "mongoose";
import { Types } from "ts-openapi";

export interface IPackage {
  name: string;
  bandwidth: number;
  storage: number;
  duration: number; // This is in days
  userCount: number;
  missionCount: number;
  alertCount: number;
  vodCount: number;
  layerCount: number;
  clientCount: number;
  locationCount: number;
  userGroupCount: number;
  poster: string;
  price: number;
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  isActive: boolean; // index
  createdAt: Date;
  updatedAt: Date;
}

export const PackageType = {
  name: Types.String(),
  bandwidth: Types.Number(),
  storage: Types.Number(),
  duration: Types.Number(), // This is in days
  userCount: Types.Number(),
  missionCount: Types.Number(),
  alertCount: Types.Number(),
  vodCount: Types.Number(),
  layerCount: Types.Number(),
  clientCount: Types.Number(),
  locationCount: Types.Number(),
  userGroupCount: Types.Number(),
  poster: Types.String(),
  price: Types.Number(),
  createdBy: Types.String(),
  updatedBy: Types.String(),
  isActive: Types.Boolean(), // index
  createdAt: Types.DateTime(),
  updatedAt: Types.DateTime(),
};

const packageschema = new mongoose.Schema<IPackage>(
  {
    name: {
      type: String,
      required: true,
    },
    bandwidth: {
      type: Number,
      required: true,
    },
    storage: {
      type: Number,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
    },
    userCount: {
      type: Number,
      required: true,
    },
    missionCount: {
      type: Number,
      required: true,
    },
    alertCount: {
      type: Number,
      required: true,
    },
    vodCount: {
      type: Number,
      required: true,
    },
    layerCount: {
      type: Number,
      required: true,
    },
    clientCount: {
      type: Number,
      required: true,
    },
    locationCount: {
      type: Number,
      required: true,
    },
    userGroupCount: {
      type: Number,
      required: true,
    },
    poster: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    isActive: {
      type: Boolean,
      default: true,
      required: true,
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
  },
);
packageschema.index({ name: 1 }, { unique: true });
packageschema.index({
  isActive: 1,
});
export default packageschema;
