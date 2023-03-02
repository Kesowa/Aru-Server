import mongoose from "mongoose";
import { RESET_PASSWORD_TOKEN_EXPIRE } from "../constants";

export interface IPassReset {
  _id: mongoose.Types.ObjectId;
  email: string;
  passwordResetToken: string; // index
  retries: number;
  createdAt: Date;
  updatedAt: Date;
}

const PassResetSchema = new mongoose.Schema<IPassReset>(
  {
    email: String,
    passwordResetToken: {
      type: String,
    },
    retries: { type: Number, min: 0, max: 5, default: 0 },
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

PassResetSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: RESET_PASSWORD_TOKEN_EXPIRE }
);
PassResetSchema.index({ email: 1 }, { unique: true });
PassResetSchema.index({ passwordResetToken: 1 });
export default PassResetSchema;
