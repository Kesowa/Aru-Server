import mongoose from "mongoose";
import Mission from "../models/mission";
import Tenant from "../models/tenant";
export interface IVOD {
  _id: mongoose.Types.ObjectId;
  flightID: mongoose.Types.ObjectId; // index
  missionID: mongoose.Types.ObjectId; // index
  videoPath: string;
  bookmarks: Map<number, String>;
  thumbnail: string;
  locationID?: mongoose.Types.ObjectId; // index
  tenantId: mongoose.Types.ObjectId; // index
  videoName: string;
  fileSize: number;
  isSRT: boolean;
  isFlagged: boolean;
  createdAt: Date;
  updatedAt: Date;
}
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
  }
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
  { sparse: true }
);
VODSchema.pre("save", async function () {
  await Mission.updateOne(
    { _id: this.missionID },
    { $inc: { size: this.fileSize } }
  );
  await Tenant.updateOne(
    { _id: this.tenantId },
    { $inc: { actualSize: this.fileSize } }
  );
});
VODSchema.post(
  "remove",
  async function (this: { missionID; fileSize; tenantId }) {
    await Mission.updateOne(
      { _id: this.missionID },
      { $inc: { size: -this.fileSize } }
    );
    await Tenant.updateOne(
      { _id: this.tenantId },
      { $inc: { actualSize: -this.fileSize } }
    );
  }
);
export default VODSchema;
