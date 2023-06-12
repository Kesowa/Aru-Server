import mongoose from "mongoose";
import Mission from "../models/mission";
import Tenant from "../models/tenant";
import { thermalStatus, thermalStatusType } from "./sharedSchemas";
export interface IAlert {
  _id: mongoose.Types.ObjectId;
  missionId: mongoose.Types.ObjectId; // index
  location: {
    lat?: number;
    long?: number;
  };
  isFlagged: boolean;
  isThreadExist: boolean;
  commentCount: Number;
  locationName: string;
  fileSize: number;
  note: string;
  createdBy: mongoose.Types.ObjectId;
  onSite: boolean;
  flightId: mongoose.Types.ObjectId; // index
  tenantId: mongoose.Types.ObjectId; // index
  pcount: number; // People count
  type: "Manual" | "Automated" | "Android"; // index
  image: string;
  locationId?: mongoose.Types.ObjectId; // index
  createdAt: Date;
  updatedAt: Date;
  thermalStatus: thermalStatusType;
}
const alertSchema = new mongoose.Schema<IAlert>(
  {
    location: {
      lat: {
        type: Number,
        required: false,
      },
      long: {
        type: Number,
        required: false,
      },
    },
    fileSize: {
      type: Number,
    },
    missionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "mission",
      required: true,
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
    locationName: {
      type: String,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    locationId: {
      type: mongoose.Schema.Types.Mixed,
      ref: "location",
      required: false,
    },
    flightId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "flight",
      required: true,
    },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tenant",
      required: true,
    },
    pcount: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      default: "Manual",
      enum: ["Manual", "Automated", "Android"],
    },
    image: {
      type: String,
      required: true,
    },
    note: {
      type: String,
    },
    onSite: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
    },
    updatedAt: {
      type: Date,
    },
    thermalStatus
  },
  {
    timestamps: true,
  }
);
alertSchema.index({
  flightId: 1,
  missionId: 1,
  tenantId: 1,
  type: 1,
});
alertSchema.index({ locationId: 1 }, { sparse: true });
alertSchema.pre("save", async function () {
  await Tenant.updateOne(
    { _id: this.tenantId },
    { $inc: { actualSize: this.fileSize, allAlertSize: this.fileSize } }
  );
  await Mission.updateOne(
    { _id: this.missionId },
    { $inc: { size: this.fileSize } }
  );
});
alertSchema.post(
  "remove",
  async function (this: {
    tenantId: mongoose.Types.ObjectId;
    fileSize: number;
    missionId: mongoose.Types.ObjectId;
  }) {
    await Tenant.updateOne(
      { _id: this.tenantId },
      { $inc: { actualSize: -this.fileSize, allAlertSize: -this.fileSize } }
    );
    await Mission.updateOne(
      { _id: this.missionId },
      { $inc: { size: -this.fileSize } }
    );
  }
);
export default alertSchema;
