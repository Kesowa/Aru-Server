import mongoose from "mongoose";
export interface IManufacturer {
  _id: mongoose.Types.ObjectId;
  name: string;
  address: string;
  nationality: string;
  website: string;
  contacts: {
    name: string;
    designation: string;
    Mobile: string;
    email: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: mongoose.Types.ObjectId;
  tenantID: mongoose.Types.ObjectId; // index
}
const manufacturerSchema = new mongoose.Schema<IManufacturer>(
  {
    name: {
      type: String,
      required: true,
    },
    address: {
      type: String,
    },
    nationality: {
      type: String,
    },
    website: {
      type: String,
    },
    contacts: [
      {
        name: String,
        designation: String,
        Mobile: String,
        email: String,
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    tenantID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tenant",
      required: true,
    },
  },
  { timestamps: true }
);
manufacturerSchema.index({ tenantID: 1 });
export default manufacturerSchema;
