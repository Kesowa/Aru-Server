import mongoose from "mongoose";

const docModels = <const>["alert", "document", "vod"];
export type docTypes = typeof docModels[number];

export type IComment = {
  _id: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;
  content: string;
  createdAt: Date;
  updatedAt: Date;
};

export const CommentSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
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
