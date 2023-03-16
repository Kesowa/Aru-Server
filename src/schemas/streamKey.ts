import mongoose from "mongoose";

export interface IStreamKey {
  _id: mongoose.Types.ObjectId;
  isActive: boolean;
  pStatus: boolean;
  createdBy: mongoose.Types.ObjectId;
  streamKey: string; // index
  tenantID: mongoose.Types.ObjectId; // index
  assetID?: mongoose.Types.ObjectId;
  missionID: mongoose.Types.ObjectId;
  flightID: mongoose.Types.ObjectId; // index
  locationID?: mongoose.Types.ObjectId;
  inputID?: String;
  channelID?: String;
  uuid?: String;
  createdAt: Date;
  updatedAt: Date;
}

const streamKeySchema = new mongoose.Schema<IStreamKey>(
  {
    isActive: {
      type: Boolean,
      required: true,
    },
    pStatus: {
      type: Boolean,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "user",
    },
    createdAt: {
      type: Date,
      required: true,
    },
    streamKey: String,
    tenantID: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    assetID: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      ref: "asset",
    },
    missionID: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "mission",
    },
    flightID: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    locationID: {
      type: mongoose.Schema.Types.Mixed,
      required: false,
      ref: "location",
    },
    inputID: {
      type: String,
      required: false,
    },
    channelID: {
      type: String,
      required: false,
    },
    updatedAt: {
      type: Date,
    },
    uuid: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);
const streamDuration = 60 * 60 * 4;
streamKeySchema.index({ createdAt: 1 }, { expireAfterSeconds: streamDuration });
streamKeySchema.index({
  streamKey: 1,
  flightID: 1,
  tenantID: 1,
});

export default streamKeySchema;