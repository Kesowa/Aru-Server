import mongoose from "mongoose";
export interface IMission {
  _id: mongoose.Types.ObjectId;
  deliverables: string[];
  status: "Upcoming" | "Live" | "Completed" | "Review"; // index
  user: mongoose.Types.ObjectId; // index
  pilotAssigned: string;
  assetID?: mongoose.Types.ObjectId;
  name: string;
  description: string;
  tenantId: mongoose.Types.ObjectId; // index
  clientId: mongoose.Types.ObjectId[]; // index
  missionType: mongoose.Types.ObjectId;
  invites: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  size: number;
  isPublic: boolean;
  _previousSize: number;
}
const missionSchema = new mongoose.Schema<IMission>(
  {
    name: {
      type: String,
      required: true,
      unique: false,
    },
    description: {
      type: String,
      // required: true,
    },
    deliverables: [String],
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    assetID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "asset",
      required: false,
    },
    clientId: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
      },
    ],
    status: {
      type: String,
      default: "Upcoming",
      enum: ["Upcoming", "Live", "Completed", "Review"],
    },
    pilotAssigned: {
      type: String,
    },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tenant",
    },
    missionType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "missiontype",
      required: true,
    },
    invites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "invite",
      },
    ],
    size: { type: Number, default: 0 },
    isPublic: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    strict: true,
  }
);
missionSchema.index({
  name: "text",
  description: "text",
  deliverables: "text",
});
missionSchema.index({
  user: 1,
  clientId: 1,
  tenantId: 1,
  status: 1,
});
export default missionSchema;
