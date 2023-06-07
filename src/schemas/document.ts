import mongoose from "mongoose";
import Mission from "../models/mission";
import Tenant from "../models/tenant";
import { Types } from "ts-openapi";

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
  commentCount: Number;
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
}
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
  }
);
documentSchema.index({
  filePath: 1,
  missionId: 1,
  tenantId: 1,
  folderName: 1,
});
documentSchema.pre("save", async function () {
  await Tenant.updateOne(
    { _id: this.tenantId },
    { $inc: { actualSize: this.fileSize, allDocumentsSize: this.fileSize } }
  );
  await Mission.updateOne(
    { _id: this.missionId },
    { $inc: { size: this.fileSize } }
  );
});
documentSchema.post(
  "remove",
  async function (this: {
    tenantId: mongoose.Types.ObjectId;
    fileSize: number;
    missionId: mongoose.Types.ObjectId;
  }) {
    await Tenant.updateOne(
      { _id: this.tenantId },
      { $inc: { actualSize: -this.fileSize, allDocumentsSize: -this.fileSize } }
    );
    await Mission.updateOne(
      { _id: this.missionId },
      { $inc: { size: -this.fileSize } }
    );
  }
);
export default documentSchema;
