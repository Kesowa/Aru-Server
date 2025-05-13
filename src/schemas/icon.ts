import mongoose from "mongoose";
import { Types } from "ts-openapi";

import Tenant from "../models/tenant";
import { deletePublicFileUsingPath } from "../utils/fileDeleteUtils";

interface IIconMethods {
  create(): Promise<IIcon>;
  delete(): Promise<void>;
}

export type IconModel = mongoose.Model<IIcon, {}, IIconMethods>;

export interface IIcon {
  _id: mongoose.Types.ObjectId;
  name: string;
  description: string;
  tags: string[];
  fileSize: number;
  createdBy: mongoose.Types.ObjectId;
  tenantId: mongoose.Types.ObjectId; // index
  image: string;
  // image2x: string;
  // image3x: string;
  height: number;
  width: number;
  anchorX: number;
  anchorY: number;
  createdAt: Date;
  updatedAt: Date;
}

export const IconType = {
  _id: mongoose.Types.ObjectId,
  name: Types.String(),
  description: Types.String(),
  tags: Types.Array({ arrayType: Types.String() }),
  fileSize: Types.Number(),
  createdBy: mongoose.Types.ObjectId,
  tenantId: mongoose.Types.ObjectId, // index,
  image: Types.String(),
  // image2x: Types.String(),
  // image3x: Types.String(),
  height: Types.Number(),
  width: Types.Number(),
  anchorX: Types.Number(),
  anchorY: Types.Number(),
  createdAt: Date,
  updatedAt: Date,
};
const iconSchema = new mongoose.Schema<IIcon>(
  {
    name: {
      type: String,
      required: true,
    },
    description: String,
    tags: mongoose.Schema.Types.Array,
    fileSize: {
      type: Number,
      required: true,
      validate: (fileSize) => fileSize > 0
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tenant",
      required: true,
    },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tenant",
      required: true,
    },
    image: String,
    // image2x: String,
    // image3x: String,
    height: Number,
    width: Number,
    anchorX: Number,
    anchorY: Number,
    createdAt: Date,
    updatedAt: Date,
  },
  {
    timestamps: true,
  },
);
iconSchema.index({
  tenantId: 1,
  name: 1,
});
iconSchema.methods.create = async function() {
  const doc = this as IIcon & mongoose.Document;
  await doc.save();
  // update size details
  await Tenant.updateOne(
    { _id: doc.tenantId },
    {
      $inc: {
        actualSize: doc.fileSize,
        // allAlertSize: doc.fileSize,
        // actualAlertCount: 1,
      },
    },
  );
  return await doc.save();
};
iconSchema.methods.delete = async function() {
  const doc = this as IIcon & mongoose.Document;
  // delete actual file
  await deletePublicFileUsingPath(doc.image);
  // update size details
  await Tenant.updateOne(
    { _id: doc.tenantId },
    {
      $inc: {
        actualSize: -doc.fileSize,
        // allAlertSize: -doc.fileSize,
        // actualAlertCount: -1,
      },
    },
  );
  // delete the document
  await doc.deleteOne();
};
export default iconSchema;
