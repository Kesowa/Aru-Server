import mongoose from "mongoose";
import { Types } from "ts-openapi";

import Mission from "../models/mission";
import Tenant from "../models/tenant";
import { deletePublicFileUsingPath } from "../utils/fileDeleteUtils";
import { deleteHlsVodUsingIndex } from "../utils/videoUtils";
interface IVODMethods {
  create(): Promise<IVOD>;
  delete(): Promise<void>;
}
export type VODModel = mongoose.Model<IVOD, {}, IVODMethods>;
export interface IVOD {
  _id: mongoose.Types.ObjectId;
  flightID: mongoose.Types.ObjectId; // index
  missionID: mongoose.Types.ObjectId; // index
  videoPath: string;
  bookmarks: Map<number, string>;
  thumbnail: string;
  originalFile?: string;
  locationID?: mongoose.Types.ObjectId; // index
  tenantId: mongoose.Types.ObjectId; // index
  videoName: string;
  fileSize: number;
  isSRT: boolean;
  isFlagged: boolean;
  isThreadExist: boolean;
  commentCount: number;
  createdAt: Date;
  updatedAt: Date;
}
export const VODType = {
  _id: Types.String(),
  flightID: Types.String(), // index
  missionID: Types.String(), // index
  videoPath: Types.String(),
  // bookmarks: Map<number, String>; // No matching Type found in ts-openapi
  thumbnail: Types.String(),
  originalFile: Types.String(),
  locationID: Types.String(), // index
  tenantId: Types.String(), // index
  videoName: Types.String(),
  fileSize: Types.Number(),
  isSRT: Types.Boolean(),
  isFlagged: Types.Boolean(),
  isThreadExist: Types.Boolean(),
  commentCount: Types.Number(),
  createdAt: Types.DateTime(),
  updatedAt: Types.DateTime(),
};
const VODSchema = new mongoose.Schema<IVOD>(
  {
    flightID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "flight",
      required: true,
    },
    missionID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "mission",
      required: true,
    },
    locationID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "location",
      required: false,
    },
    videoPath: {
      type: String,
      required: true,
    },
    bookmarks: {
      type: Map,
      required: false,
    },
    thumbnail: {
      type: String,
      required: true,
    },
    originalFile: {
      type: String,
      required: false,
    },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tenant",
    },
    fileSize: {
      type: Number,
    },
    videoName: {
      type: String,
      required: true,
    },
    isSRT: {
      type: Boolean,
      default: false,
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
    // startTime: {
    //     type: Date
    // },
    // endTime: {
    //     type:Date
    // }
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
VODSchema.index({
  flightID: 1,
  missionID: 1,
  tenantId: 1,
});
VODSchema.index(
  {
    locationID: 1,
  },
  { sparse: true },
);
VODSchema.methods.create = async function () {
  const doc = this as IVOD & mongoose.Document;
  // update size details
  await Mission.updateOne(
    { _id: doc.missionID },
    { $inc: { size: doc.fileSize } },
  );
  await Tenant.updateOne(
    { _id: doc.tenantId },
    {
      $inc: {
        actualSize: doc.fileSize,
        allVodSize: doc.fileSize,
        actualVodCount: 1,
      },
    },
  );
  // save document
  return await doc.save();
};
VODSchema.methods.delete = async function () {
  const doc = this as IVOD & mongoose.Document;
  // delete index files
  await deleteHlsVodUsingIndex(doc.videoPath);
  // delete video file
  if (doc.originalFile) await deletePublicFileUsingPath(doc.originalFile);
  // delete thumbnail
  if (doc.thumbnail) await deletePublicFileUsingPath(doc.thumbnail);
  // update size details
  await Mission.updateOne(
    { _id: doc.missionID },
    { $inc: { size: -doc.fileSize } },
  );
  await Tenant.updateOne(
    { _id: doc.tenantId },
    {
      $inc: {
        actualSize: -doc.fileSize,
        allVodSize: -doc.fileSize,
        actualVodCount: -1,
      },
    },
  );
  // delete document
  await doc.deleteOne();
};
export default VODSchema;
