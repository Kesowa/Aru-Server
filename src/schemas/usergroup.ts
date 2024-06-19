import mongoose from "mongoose";
import { Types } from "ts-openapi";
import { PERMS } from "../utils/permissions";

export interface IUserGroup {
  _id: mongoose.Types.ObjectId;
  name: string; // index
  permissions: PERMS[];
  tenantId: mongoose.Types.ObjectId; // index
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  isActive: Boolean;
  createdAt: Date;
  updatedAt: Date;
}
export const UserGroupType = {
  _id: Types.String(),
  name: Types.String(), // index
  permissions: Types.Array({ arrayType: Types.String() }),
  tenantId: Types.String(), // index
  createdBy: Types.String(),
  updatedBy: Types.String(),
  isActive: Types.Boolean(),
  createdAt: Types.DateTime(),
  updatedAt: Types.DateTime(),
};
const usergroupschema = new mongoose.Schema<IUserGroup>(
  {
    name: {
      type: String,
      required: true,
    },
    permissions: [
      {
        type: String,
        enum: PERMS,
      },
    ],
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tenant",
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
  },
  {
    timestamps: true,
  }
);
usergroupschema.index({
  name: 1,
  tenantId: 1,
});
export default usergroupschema;
