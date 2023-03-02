import mongoose from "mongoose";
export interface IUserGroup {
  _id: mongoose.Types.ObjectId;
  name: string; // index
  permissions: mongoose.Types.ObjectId[];
  tenantId: mongoose.Types.ObjectId; // index
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  isActive: Boolean;
  createdAt: Date;
  updatedAt: Date;
}
const usergroupschema = new mongoose.Schema<IUserGroup>(
  {
    name: {
      type: String,
      required: true,
    },
    permissions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "permission",
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
