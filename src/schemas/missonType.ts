import mongoose from "mongoose";
export interface IMissionType {
  name: string; // index
  description: string;
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  isActive: boolean; // index
  createdAt: Date;
  updatedAt: Date;
}
const missionTypeSchema = new mongoose.Schema<IMissionType>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
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
    isActive: {
      type: Boolean,
      default: true,
      required: true,
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
missionTypeSchema.index({
  name: 1,
  isActive: 1,
});
export default missionTypeSchema;
