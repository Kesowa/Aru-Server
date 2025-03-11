import mongoose from "mongoose";
const inviteDuration = 60 * 60 * 24 * 7; //* Invite duration in seconds (7 days)
export interface IInvite {
  _id: mongoose.Types.ObjectId;
  valid: boolean;
  creator: mongoose.Types.ObjectId;
  missionID: mongoose.Types.ObjectId;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}
export const inviteSchema = new mongoose.Schema<IInvite>(
  {
    valid: {
      type: Boolean,
      defaultValue: true,
      required: true,
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "user",
    },
    missionID: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "mission",
    },
    email: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
    },
    updatedAt: {
      type: Date,
    },
  },
  { timestamps: true },
);
inviteSchema.index({ missionID: 1 }, { expireAfterSeconds: inviteDuration });
