import path from "path";

import mongoose from "mongoose";
import { Types } from "ts-openapi";

import Mission from "../models/mission";
import Tenant from "../models/tenant";
import {
  deletePublicFileUsingPath,
  deletePublicFolderUsingPath,
} from "../utils/fileDeleteUtils";
import { deleteThumbnails, saveThumbnails } from "../utils/imageUtils";

interface IDocumentMethods {
  create(): Promise<IDocument>;
  delete(): Promise<void>;
}

export type DocumentModel = mongoose.Model<IDocument, {}, IDocumentMethods>;

export interface IDocument {
  _id: mongoose.Types.ObjectId;
  name: string;
  modDate: Date;
  fileSize: number;
  fileType?: string;
  filePath: string; // index
  folderName: string; // index
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  missionId: mongoose.Types.ObjectId; // index
  tenantId: mongoose.Types.ObjectId; // index
  isFlagged: boolean;
  isThreadExist: boolean;
  commentCount: number;
  createdAt: Date;
  updatedAt: Date;
}
export const DocumentType = {
  _id: Types.String(),
  name: Types.String(),
  modDate: Types.DateTime(),
  fileSize: Types.Number(),
  fileType: Types.String(),
  filePath: Types.String(), // index
  folderName: Types.String(), // index
  createdBy: Types.String(),
  updatedBy: Types.String(),
  missionId: Types.String(), // index
  tenantId: Types.String(), // index
  isFlagged: Types.Boolean(),
  isThreadExist: Types.Boolean(),
  commentCount: Types.Number(),
  createdAt: Types.DateTime(),
  updatedAt: Types.DateTime(),
};
const documentSchema = new mongoose.Schema<IDocument>(
  {
    name: {
      type: String,
      unique: false,
    },
    modDate: {
      type: Date,
    },
    fileSize: {
      type: Number,
    },
    filePath: {
      type: String,
    },
    fileType: {
      type: String,
      required: false,
    },
    folderName: {
      type: String,
    },
    missionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "mission",
    },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tenant",
    },
    isFlagged: {
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
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
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
documentSchema.index({
  filePath: 1,
  missionId: 1,
  tenantId: 1,
  folderName: 1,
});
documentSchema.methods.create = async function () {
  const doc = this as IDocument & mongoose.Document;
  // generate thumbnails for images
  if (
    (doc.folderName == "rawPhotos" || doc.folderName == "photos") &&
    (doc.fileType == "image/jpeg" || doc.fileType == "image/png")
  ) {
    const thumbs = await saveThumbnails(doc.filePath);
    doc.fileSize += thumbs.size;
    await doc.save();
  }
  // update size details
  await Tenant.updateOne(
    { _id: doc.tenantId },
    { $inc: { actualSize: doc.fileSize, allDocumentsSize: doc.fileSize } },
  );
  await Mission.updateOne(
    { _id: doc.missionId },
    { $inc: { size: doc.fileSize } },
  );
  // save the document
  return await doc.save();
};
documentSchema.methods.delete = async function () {
  const doc = this as IDocument & mongoose.Document;
  // delete thumbnails for images
  if (
    (doc.folderName == "rawPhotos" || doc.folderName == "photos") &&
    (doc.fileType == "image/jpeg" || doc.fileType == "image/png")
  ) {
    await deleteThumbnails(doc.filePath);
  }
  // delete actual files / folders related to document
  if (doc.fileType == "pointCloud") {
    await deletePublicFolderUsingPath(path.parse(doc.filePath).dir);
  } else {
    await deletePublicFileUsingPath(doc.filePath);
  }
  // update size details
  await Tenant.updateOne(
    { _id: doc.tenantId },
    { $inc: { actualSize: -doc.fileSize, allDocumentsSize: -doc.fileSize } },
  );
  await Mission.updateOne(
    { _id: doc.missionId },
    { $inc: { size: -doc.fileSize } },
  );
  // delete the document
  await doc.deleteOne();
};
export default documentSchema;
