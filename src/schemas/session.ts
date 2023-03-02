import mongoose from "mongoose";
const sessionDuration = 60 * 60 * 24; //* Session duration in seconds (1 day)
export interface ISession {
  _id: mongoose.Types.ObjectId;
  valid: boolean;
  owner: mongoose.Types.ObjectId; // index
  createdAt: Date;
  updatedAt: Date;
}
export const sessionSchema = new mongoose.Schema<ISession>(
  {
    valid: {
      type: Boolean,
      defaultValue: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "user",
    },
    createdAt: {
      type: Date,
    },
    updatedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);
sessionSchema.index({ createdAt: 1 }, { expireAfterSeconds: sessionDuration });
sessionSchema.index({ owner: 1 });
