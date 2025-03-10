import mongoose from "mongoose";
import { Types } from "ts-openapi";

export interface IMissionType {
  name: string; // index
  description: string;
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  isActive: boolean; // index
  createdAt: Date;
  updatedAt: Date;
}

export const MissionTypeType = {
  name: Types.String(), // index
  description: Types.String(),
  createdBy: Types.String(),
  updatedBy: Types.String(),
  isActive: Types.Boolean(), // index
  createdAt: Types.DateTime(),
  updatedAt: Types.DateTime(),
};

const missionTypeSchema = new mongoose.Schema<IMissionType>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
      required: true,
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
missionTypeSchema.index({
  name: 1,
  isActive: 1,
});
export default missionTypeSchema;
