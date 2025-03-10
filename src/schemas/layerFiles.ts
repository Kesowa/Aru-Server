import mongoose from "mongoose";
import Layer from "../models/layer";
import Tenant from "../models/tenant";
import { Types } from "ts-openapi";
import { deletePublicFileUsingPath } from "../utils/fileDeleteUtils";
import { deleteThumbnails, saveThumbnails } from "../utils/imageUtils";
import Mission from "../models/mission";

interface ILayerFileMethods {
  create(): Promise<ILayerFile>;
  delete(): Promise<void>;
}

export type LayerFileModel = mongoose.Model<ILayerFile, {}, ILayerFileMethods>;

export interface ILayerFile {
  _id: mongoose.Types.ObjectId;
  name: string;
  layerId: mongoose.Types.ObjectId; // index
  layers: mongoose.Types.ObjectId[]; // index // REVISIT
  sys_Id?: string; // index
  featureLabel?: string;
  centerPoints?: { lng: number; lat: number };
  coverPhoto: boolean;
  filePath: string;
  fileType: string;
  tenantId: mongoose.Types.ObjectId; // index
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  isReview: boolean; // index
  isThreadExist: boolean;
  commentCount: number;
  fileSize: number;
  createdAt: Date;
  updatedAt: Date;
}
export const LayerFileType = {
  _id: Types.String(),
  name: Types.String(),
  layerId: Types.String(), // index
  layers: Types.Array({ arrayType: Types.String() }), // index // REVISIT
  sys_Id: Types.String(), // index
  featureLabel: Types.String(),
  centerPoints: Types.Object({
    properties: { lng: Types.Number(), lat: Types.Number() },
  }),
  coverPhoto: Types.Boolean(),
  filePath: Types.String(),
  fileType: Types.String(),
  tenantId: Types.String(), // index
  createdBy: Types.String(),
  updatedBy: Types.String(),
  isReview: Types.Boolean(), // index
  fileSize: Types.Number(),
  createdAt: Types.DateTime(),
  updatedAt: Types.DateTime(),
};
const layerFilesSchema = new mongoose.Schema<ILayerFile>(
  {
    name: {
      type: String,
    },
    layerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "layers",
    },
    layers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "layers",
      },
    ],
    sys_Id: {
      type: String,
      required: false,
    },
    featureLabel: {
      type: String,
      required: false,
    },
    coverPhoto: Boolean,
    fileSize: {
      type: Number,
    },
    centerPoints: {
      lng: Number,
      lat: Number,
      required: false,
    },
    filePath: {
      type: String,
    },
    fileType: {
      type: String,
      require: true,
    },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tenant",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
    },
    isReview: {
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
  },
  {
    timestamps: true,
  }
);
layerFilesSchema.index({
  layerId: 1,
  tenantId: 1,
  isReview: 1,
});
layerFilesSchema.index({ sys_Id: 1 }, { sparse: true });
layerFilesSchema.methods.create = async function () {
  const doc = this as ILayerFile & mongoose.Document;
  // save thumbnails
  if (doc.fileType == "image/jpeg" || doc.fileType == "image/png") {
    const thumbs = await saveThumbnails(doc.filePath);
    doc.fileSize += thumbs.size;
    await doc.save();
  }
  // update size details
  await Tenant.updateOne(
    { _id: doc.tenantId },
    { $inc: { actualSize: doc.fileSize, allLayerFileSize: doc.fileSize } }
  );
  const layerDoc = await Layer.findById(doc.layerId);
  layerDoc.fileSize += doc.fileSize;
  await layerDoc.save();
  await Mission.updateOne(
    { _id: layerDoc.missionId },
    { $inc: { size: doc.fileSize } }
  );
  // save the document
  return await doc.save();
};
layerFilesSchema.methods.delete = async function () {
  const doc = this as ILayerFile & mongoose.Document;
  // delete thumbnails
  if (doc.fileType == "image/jpeg" || doc.fileType == "image/png") {
    await deleteThumbnails(doc.filePath);
  }
  // delete actual file
  await deletePublicFileUsingPath(doc.filePath);
  // update size details
  await Tenant.updateOne(
    { _id: doc.tenantId },
    { $inc: { actualSize: -doc.fileSize, allLayerFileSize: -doc.fileSize } }
  );
  const layerDoc = await Layer.findById(doc.layerId);
  layerDoc.fileSize -= doc.fileSize;
  await layerDoc.save();
  await Mission.updateOne(
    { _id: layerDoc.missionId },
    { $inc: { size: -doc.fileSize } }
  );
  // delete the document
  await doc.deleteOne();
};
export default layerFilesSchema;
