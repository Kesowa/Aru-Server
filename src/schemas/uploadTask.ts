import { Schema, Types } from "mongoose";
import { DocToDir } from "../utils/pathUtils";
import { PostPolicyResult } from "minio";

export type docTypes = keyof typeof DocToDir;
const docModels = Object.keys(DocToDir);

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
  metadata: {
    objectkey: string,
    mimetype: string,
    filesize: number,
  };
  presigned: {
    formData: {
      name: string,
      user: string,
      tenant: string,
    },
    postURL: string
  },
};

export const UploadTaskSchema = new Schema<UploadTask>(
  {
    doc: { type: Schema.Types.ObjectId, required: false },
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
    metadata: {
      objectkey: String,
      filesize: Number,
      mimetype: String
    },
    presigned: {
      postURL: String,
      formData: Schema.Types.Map
    }
  },
  { timestamps: true }
);

UploadTaskSchema.index({ tenant: 1, docModel: 1, doc: 1 });
