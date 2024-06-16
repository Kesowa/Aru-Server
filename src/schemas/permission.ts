import mongoose from "mongoose";
import { Types } from "ts-openapi";

export interface IPermission {
  name: string; // index
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export const PermissionType = {
  name: Types.String(), // index
  createdBy: Types.String(),
  updatedBy: Types.String(),
  createdAt: Types.DateTime(),
  updatedAt: Types.DateTime(),
};

const permissionschema = new mongoose.Schema<IPermission>(
  {
    name: {
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
