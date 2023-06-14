import mongoose from "mongoose";
import Mission from "../models/mission";
import Tenant from "../models/tenant";
import { Types } from "ts-openapi";
export interface IFlightLog {
  _id: mongoose.Types.ObjectId;
  date: Date;
  time: Date;
  missionID: mongoose.Types.ObjectId; // index
  flightID: mongoose.Types.ObjectId;
  assetID: mongoose.Types.ObjectId;
  locationID?: mongoose.Types.ObjectId; // index
  duration: string;
  location: string;
  geofence: {};
  flightArea: string;
  filePath: string;
  pilotName: string;
  jobType: string;
  deliverables: string[];
  tenantId: mongoose.Types.ObjectId; // index
  fileSize: number;
}
export const FlightLogType = {
  _id: Types.String(),
  date: Types.DateTime(),
  time: Types.DateTime(),
  missionID: Types.String(), // index
  flightID: Types.String(),
  assetID: Types.String(),
  locationID: Types.String(), // index
  duration: Types.String(),
  location: Types.String(),
  geofence: Types.Object({ properties: {} }),
  flightArea: Types.String(),
  filePath: Types.String(),
  pilotName: Types.String(),
  jobType: Types.String(),
  deliverables: Types.Array({ arrayType: Types.String() }),
  tenantId: Types.String(), // index
  fileSize: Types.Number(),
};
const flightLogSchema = new mongoose.Schema<IFlightLog>({
  date: String,
  time: String,
  missionID: mongoose.Schema.Types.ObjectId,
  flightID: mongoose.Schema.Types.ObjectId,
  assetID: mongoose.Schema.Types.ObjectId,
  locationID: {
    type: mongoose.Schema.Types.ObjectId,
    required: false,
  },
  duration: String,
  location: String,
  geofence: {},
  flightArea: String,
  filePath: String,
  pilotName: String,
  jobType: String,
  deliverables: [String],
  tenantId: mongoose.Schema.Types.ObjectId,
  fileSize: Number,
});
flightLogSchema.index({
  missionID: 1,
  tenantId: 1,
});
flightLogSchema.index({ locationID: 1 }, { sparse: true });
flightLogSchema.pre("save", async function () {
  await Tenant.updateOne(
    { _id: this.tenantId },
    { $inc: { actualSize: this.fileSize } }
  );
  await Mission.updateOne(
    { _id: this.missionID },
    { $inc: { size: this.fileSize } }
  );
});
flightLogSchema.post(
  "remove",
  async function (this: {
    tenantId: mongoose.Types.ObjectId;
    missionID: mongoose.Types.ObjectId;
    fileSize: number;
  }) {
    await Tenant.updateOne(
      { _id: this.tenantId },
      { $inc: { actualSize: -this.fileSize } }
    );
    await Mission.updateOne(
      { _id: this.missionID },
      { $inc: { size: -this.fileSize } }
    );
  }
);
export default flightLogSchema;
