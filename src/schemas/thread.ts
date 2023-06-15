import mongoose from "mongoose";
import { Types } from "ts-openapi";

const docModels = <const>["alert", "document", "vod", "layer", "layerfile"];
export type docTypes = typeof docModels[number];

export type IComment = {
  _id: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;
  authorName: string;
  avatar: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
};

export const CommentType = {
  _id: Types.String(),
  author: Types.String(),
  authorName: Types.String(),
  avatar: Types.String(),
  content: Types.String(),
  createdAt: Types.DateTime(),
  updatedAt: Types.DateTime(),
};

export const CommentSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    authorName: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
    },
    content: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export type IThread = {
  _id: mongoose.Types.ObjectId;
  doc: mongoose.Types.ObjectId;
  docModel: docTypes;
  comments: IComment[];
  createdAt: Date;
  updatedAt: Date;
  tenant: mongoose.Types.ObjectId;
};

export const ThreadType = {
  _id: Types.String(),
  doc: Types.String(),
  docModel: Types.StringEnum({ values: ["alert", "document", "vod"] }),
  comments: Types.Array({ arrayType: CommentType }),
  createdAt: Types.DateTime(),
  updatedAt: Types.DateTime(),
  tenant: Types.String(),
};

export const ThreadSchema = new mongoose.Schema(
  {
    doc: { type: mongoose.Schema.Types.ObjectId, required: true },
    docModel: {
      type: String,
      required: true,
      enum: docModels,
    },
    comments: [CommentSchema],
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "tenant",
    },
  },
  { timestamps: true }
);

ThreadSchema.index({ doc: 1, docModel: 1 }, { unique: true });
