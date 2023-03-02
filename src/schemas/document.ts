import mongoose from "mongoose";
import Mission from "../models/mission";
import Tenant from "../models/tenant";
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
  createdAt: Date;
  updatedAt: Date;
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
    { $inc: { actualSize: this.fileSize } }
  );
  await Mission.updateOne(
    { _id: this.missionId },
    { $inc: { size: this.fileSize } }
  );
});
documentSchema.post("remove", async function () {
  await Tenant.updateOne(
    { _id: this.tenantId },
    { $inc: { actualSize: -this.fileSize } }
  );
  await Mission.updateOne(
    { _id: this.missionId },
    { $inc: { size: -this.fileSize } }
  );
});
export default documentSchema;
