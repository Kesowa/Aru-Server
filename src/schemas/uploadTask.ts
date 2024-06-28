import { Schema, Types } from "mongoose";

const docModels = <const>["vod", "layer", "alert", "document"];
export type docTypes = typeof docModels[number];

const status = <const>["started", "completed", "failed"];
export type statusType = typeof status[number];

export type UploadTask = {
  _id: Types.ObjectId;
  doc?: Types.ObjectId;
  docModel: docTypes;
  status: statusType;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  updatedBy: Types.ObjectId;
  tenant: Types.ObjectId;
  data: {
    key: string,
    type: string,
    size: number,
  }
};

export const UploadTaskSchema = new Schema<UploadTask>(
  {
    doc: { type: Schema.Types.ObjectId, required: true, index: true },
    docModel: {
      type: String,
      required: true,
      enum: docModels,
    },
    status: {
      type: String,
      required: true,
      enum: status,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "user",
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "user",
    },
    tenant: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "tenant",
    },
    data: {
      type: Schema.Types.Mixed,
      required: true,
      default: null,
    },
  },
  { timestamps: true }
);

UploadTaskSchema.index({ tenant: 1, doc: 1 }, { unique: true });
