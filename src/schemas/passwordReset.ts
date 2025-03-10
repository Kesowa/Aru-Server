import mongoose from "mongoose";
import { Types } from "ts-openapi";

import { RESET_PASSWORD_TOKEN_EXPIRE } from "../constants";

export interface IPassReset {
  _id: mongoose.Types.ObjectId;
  email: string;
  passwordResetToken: string; // index
  retries: number;
  createdAt: Date;
  updatedAt: Date;
}

export const PasswordResetType = {
  _id: Types.String(),
  email: Types.String(),
  passwordResetToken: Types.String(), // index
  retries: Types.Number(),
  createdAt: Types.DateTime(),
  updatedAt: Types.DateTime(),
};

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
  },
);

PassResetSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: RESET_PASSWORD_TOKEN_EXPIRE },
);
PassResetSchema.index({ email: 1 }, { unique: true });
PassResetSchema.index({ passwordResetToken: 1 });
export default PassResetSchema;
