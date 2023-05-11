import { Schema, Types } from "mongoose";

const docModels = <const>["vod", "layer"];
export type docTypes = typeof docModels[number];

const status = <const>["started", "completed", "failed"];
export type statusType = typeof status[number];

const inferences = <const>["violence", "deepforest"];
export type inferTypes = typeof inferences[number];

export type IAimlTask = {
  _id: Types.ObjectId;
  doc: Types.ObjectId;
  docModel: docTypes;
  infer: inferTypes;
  status: statusType;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  updatedBy: Types.ObjectId;
  tenant: Types.ObjectId;
  data: string;
};

export const AimlTaskSchema = new Schema<IAimlTask>(
  {
    doc: { type: Schema.Types.ObjectId, required: true, index: true },
    docModel: {
      type: String,
      required: true,
      enum: docModels,
    },
    infer: {
      type: String,
      required: true,
      enum: inferences,
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
      type: String,
      required: true,
      default: null,
    },
  },
  { timestamps: true }
);

AimlTaskSchema.index({ doc: 1, infer: 1 }, { unique: true });
