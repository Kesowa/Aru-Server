import mongoose from "mongoose";
export interface IPermission {
  name: string; // index
  isSideNavOption: boolean;
  isFrontendRoute: boolean;
  isPilot: boolean;
  isClient: boolean; // index
  frontendRoute: string;
  isVisibleToTenant: boolean; // index
  isVisibleToSuperAdmin: boolean;
  sideNavOptionLabel: string;
  sideNavOptionIcon: string;
  description: string;
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
const permissionschema = new mongoose.Schema<IPermission>(
  {
    name: {
      type: String,
      required: true,
    },
    isFrontendRoute: {
      type: Boolean,
      default: false,
      required: true,
    },
    isSideNavOption: {
      type: Boolean,
      default: false,
      required: true,
    },
    isPilot: {
      type: Boolean,
      default: false,
      required: true,
    },
    isClient: {
      type: Boolean,
      default: false,
      required: true,
    },
    frontendRoute: {
      type: String,
    },
    sideNavOptionIcon: {
      type: String,
    },
    sideNavOptionLabel: {
      type: String,
    },
    isVisibleToTenant: {
      type: Boolean,
      default: false,
      required: true,
    },
    isVisibleToSuperAdmin: {
      type: Boolean,
      default: false,
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
    isActive: {
      type: Boolean,
      default: true,
      required: true,
    },
    description: {
      type: String,
    },
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
permissionschema.index({
  name: 1,
  isClient: 1,
  isVisibleToTenant: 1,
});
export default permissionschema;
