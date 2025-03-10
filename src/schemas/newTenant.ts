import mongoose from "mongoose";
import { Types } from "ts-openapi";

import { RESET_PASSWORD_TOKEN_EXPIRE } from "../constants";

export interface INewTenant {
  _id: mongoose.Types.ObjectId;
  name: string;
  phoneNo: string;
  email: string; // index
  contactPerson: string;
  registrationNumber: string;
  officialWebsite: string;
  avatar?: string;
  gstNumber: string;
  billingAddressLine1: string;
  billingAddressLine2?: string;
  billingCity: string;
  billingDistrict: string;
  billingState: string;
  billingPin: string;
  isActive: boolean;
  isActivated: boolean;
  verificationCode: number;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  password: string;
}

export const NewTenantType = {
  _id: Types.String(),
  name: Types.String(),
  phoneNo: Types.String(),
  email: Types.String(), // index
  contactPerson: Types.String(),
  registrationNumber: Types.String(),
  officialWebsite: Types.String(),
  avatar: Types.String(),
  gstNumber: Types.String(),
  billingAddressLine1: Types.String(),
  billingAddressLine2: Types.String(),
  billingCity: Types.String(),
  billingDistrict: Types.String(),
  billingState: Types.String(),
  billingPin: Types.String(),
  isActive: Types.Boolean(),
  isActivated: Types.Boolean(),
  verificationCode: Types.Number(),
  isVerified: Types.Boolean(),
  createdAt: Types.DateTime(),
  updatedAt: Types.DateTime(),
  password: Types.String(),
};

const newTenantSchema = new mongoose.Schema<INewTenant>(
  {
    name: String,
    phoneNo: String,
    email: String,
    contactPerson: String,
    registrationNumber: String,
    officialWebsite: String,
    avatar: { type: String, required: false },
    gstNumber: String,
    billingAddressLine1: String,
    billingAddressLine2: String,
    billingCity: String,
    billingDistrict: String,
    billingState: String,
    billingPin: String,
    isActive: Boolean,
    isActivated: Boolean,
    verificationCode: Number,
    isVerified: Boolean,
    createdAt: Date,
    updatedAt: Date,
    password: String,
  },
  {
    timestamps: true,
  }
);

newTenantSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: RESET_PASSWORD_TOKEN_EXPIRE }
);
newTenantSchema.index({ email: 1 }, { unique: true });

export default newTenantSchema;
