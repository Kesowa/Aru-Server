import mongoose from "mongoose";
import { Types } from "ts-openapi";
import Tenant from "../models/tenant";
import { IPackage } from "./package";
export interface ITenant {
  _id: mongoose.Types.ObjectId;
  name: string;
  phoneNo: string;
  tenantRoot: any;
  email: string; // index
  contactPerson: string;
  registrationNumber: string;
  officialWebsite: string;
  avatar: string;
  gstNumber: string;
  billingAddressLine1: string;
  billingAddressLine2?: string;
  billingCity: string;
  billingDistrict: string;
  billingState: string;
  billingPin: string;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  upcomingPackages?: [];
  isActive: boolean;
  storageUsed: number;
  actualSize: mongoose.Types.Decimal128;
  modefiedEmailRequested: string;
  modefiedEmailRequestedOTPs: number[];
  modefiedphoneNoRequested: string;
  modefiedphoneNoRequestedOTPs: number[];
  activePackage: mongoose.Types.ObjectId;
  bandwidthUsed: number;
  packageStartDate: Date;
  actualUserCount: number;
  actualMissionCount: number;
  actualAlertCount: number;
  actualVodCount: number;
  actualLayerCount: number;
  actualClientCount: number;
  actualLocationCount: number;
  actualUserGroupCount: number;
  isActivated: boolean;
  publicMapRef?: string; // index
  verificationCode: number;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  allVodSize: number;
  allAlertSize: number;
  allLayerSize: number;
  allDocumentsSize: number;
  allLayerFileSize: number;
}
export const TenantType = {
  _id: Types.String(),
  name: Types.String(),
  phoneNo: Types.String(),
  // tenantRoot: any, // TODO: no "any" type found in ts-openspi
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
  createdBy: Types.String(),
  updatedBy: Types.String(),
  upcomingPackages: Types.Array({ arrayType: Types.String() }),
  isActive: Types.Boolean(),
  storageUsed: Types.Number(),
  actualSize: Types.Number(),
  modefiedEmailRequested: Types.String(),
  modefiedEmailRequestedOTPs: Types.Array({ arrayType: Types.Number() }),
  modefiedphoneNoRequested: Types.String(),
  modefiedphoneNoRequestedOTPs: Types.Array({ arrayType: Types.Number() }),
  activePackage: Types.String(),
  bandwidthUsed: Types.Number(),
  packageStartDate: Types.DateTime(),
  actualUserCount: Types.Number(),
  actualMissionCount: Types.Number(),
  actualAlertCount: Types.Number(),
  actualVodCount: Types.Number(),
  actualLayerCount: Types.Number(),
  actualClientCount: Types.Number(),
  actualLocationCount: Types.Number(),
  actualUserGroupCount: Types.Number(),
  isActivated: Types.Boolean(),
  publicMapRef: Types.String(), // index
  verificationCode: Types.Number(),
  isVerified: Types.Boolean(),
  createdAt: Types.DateTime(),
  updatedAt: Types.DateTime(),
  allVodSize: Types.Number(),
  allAlertSize: Types.Number(),
  allLayerSize: Types.Number(),
  allDocumentsSize: Types.Number(),
  allLayerFileSize: Types.Number(),
}
const tenantschema = new mongoose.Schema<ITenant>(
  {
    name: {
      type: String,
      required: true,
    },
    phoneNo: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    contactPerson: {
      type: String,
      required: true,
    },
    registrationNumber: {
      type: String,
    },
    officialWebsite: {
      type: String,
    },
    avatar: {
      type: String,
    },
    gstNumber: {
      type: String,
      required: true,
    },
    billingAddressLine1: {
      type: String,
      required: true,
    },
    billingAddressLine2: {
      type: String,
    },
    billingCity: {
      type: String,
      required: true,
    },
    billingDistrict: {
      type: String,
      required: true,
    },
    billingState: {
      type: String,
      required: true,
    },
    billingPin: {
      type: String,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    activePackage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "package",
    },
    upcomingPackages: [
      {
        type: mongoose.Schema.Types.ObjectId,
      },
    ],
    publicMapRef: {
      type: String,
      required: false,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
      required: true,
    },
    isActivated: {
      type: Boolean,
      default: false,
      required: true,
    },
    modefiedEmailRequested: {
      type: String,
    },
    modefiedEmailRequestedOTPs: [
      {
        type: Number,
      },
    ],
    modefiedphoneNoRequested: {
      type: String,
    },
    modefiedphoneNoRequestedOTPs: [
      {
        type: Number,
      },
    ],
    bandwidthUsed: {
      type: Number,
      required: true,
      default: 0,
    },
    storageUsed: {
      type: Number,
      required: true,
      default: 0,
    },
    packageStartDate: {
      type: Date,
    },
    actualSize: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
      default: 0,
    },
    actualUserCount: {
      type: Number,
      required: true,
      default: 0,
    },
    actualMissionCount: {
      type: Number,
      required: true,
      default: 0,
    },
    actualAlertCount: {
      type: Number,
      required: true,
      default: 0,
    },
    actualVodCount: {
      type: Number,
      required: true,
      default: 0,
    },
    actualLayerCount: {
      type: Number,
      required: true,
      default: 0,
    },
    actualClientCount: {
      type: Number,
      required: true,
      default: 0,
    },
    actualLocationCount: {
      type: Number,
      required: true,
      default: 0,
    },
    actualUserGroupCount: {
      type: Number,
      required: true,
      default: 0,
    },
    verificationCode: {
      type: Number,
    },
    isVerified: {
      type: Boolean,
    },
    createdAt: {
      type: Date,
    },
    updatedAt: {
      type: Date,
    },
    allVodSize: {
      required: true,
      type: Number,
      default: 0,
    },
    allAlertSize: {
      required: true,
      type: Number,
      default: 0,
    },
    allLayerSize: {
      required: true,
      type: Number,
      default: 0,
    },
    allDocumentsSize: {
      type: Number,
      required: true,
      default: 0,
    },
    allLayerFileSize: {
      required: true,
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);
tenantschema.index({ email: 1 }, { unique: true });
tenantschema.index({ publicMapRef: 1 }, { sparse: true });
type tenant = {
  _id: mongoose.Types.ObjectId;
  activePackage: { storage: number };
  actualSize: mongoose.Types.Decimal128;
};
export class SizeLimitExceeded extends Error {
  tenant: tenant;
  size: number;
  constructor(tenantDoc: tenant, size: number) {
    super();
    const {
      _id,
      activePackage: { storage },
      actualSize,
    } = tenantDoc;
    this.tenant = { _id, activePackage: { storage }, actualSize };
    this.size = size;
    this.message = `size ${size} has exceeded limit for tenant!`;
  }
}

export class InvalidPackage extends Error {
  constructor(tenant: mongoose.Types.ObjectId) {
    super();
    this.message = `No valid packages exist for ${tenant.toString()}!`;
  }
}

tenantschema.pre("updateOne", async function () {
  const query = this as any;
  const size = query._update["$inc"]?.actualSize as number;
  const id = query.getQuery()._id as mongoose.Types.ObjectId;
  console.log("TENANT SIZE AND ID", size, id);
  if (!(size && id)) return;
  const tenantDoc = await Tenant.findById(id).populate<{
    activePackage: IPackage;
  }>("activePackage");
  if (tenantDoc?.activePackage == null) throw new InvalidPackage(id);
  if (tenantDoc.activePackage.storage < Number(tenantDoc.actualSize) + size) {
    throw new SizeLimitExceeded(tenantDoc, size);
  }
});
export default tenantschema;
