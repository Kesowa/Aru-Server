import mongoose from "mongoose";
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
