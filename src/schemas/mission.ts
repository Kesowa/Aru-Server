import mongoose from "mongoose";
import { Types } from "ts-openapi";
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
}
export const MissionType = {
  _id: Types.String(),
  deliverables: Types.Array({ arrayType: Types.String() }),
  status: Types.StringEnum({
    values: ["Upcoming", "Live", "Completed", "Review"],
  }), // index
  user: Types.String(), // index
  pilotAssigned: Types.String(),
  assetID: Types.String(),
  name: Types.String(),
  description: Types.String(),
  tenantId: Types.String(), // index
  clientId: Types.Array({ arrayType: Types.String() }), // index
  missionType: Types.String(),
  invites: Types.Array({ arrayType: Types.String() }),
  createdAt: Types.DateTime(),
  updatedAt: Types.DateTime(),
  size: Types.Number(),
  isPublic: Types.Boolean(),
};
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
  },
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
