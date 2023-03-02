import mongoose from "mongoose";
export interface IPackage {
  name: string;
  bandwidth: number;
  storage: number;
  duration: number; // This is in days
  userCount: number;
  missionCount: number;
  alertCount: number;
  vodCount: number;
  layerCount: number;
  clientCount: number;
  locationCount: number;
  userGroupCount: number;
  poster: string;
  price: number;
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  isActive: boolean; // index
  createdAt: Date;
  updatedAt: Date;
}
const packageschema = new mongoose.Schema<IPackage>(
  {
    name: {
      type: String,
      required: true,
    },
    bandwidth: {
      type: Number,
      required: true,
    },
    storage: {
      type: Number,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
    },
    userCount: {
      type: Number,
      required: true,
    },
    missionCount: {
      type: Number,
      required: true,
    },
    alertCount: {
      type: Number,
      required: true,
    },
    vodCount: {
      type: Number,
      required: true,
    },
    layerCount: {
      type: Number,
      required: true,
    },
    clientCount: {
      type: Number,
      required: true,
    },
    locationCount: {
      type: Number,
      required: true,
    },
    userGroupCount: {
      type: Number,
      required: true,
    },
    poster: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
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
packageschema.index({ name: 1 }, { unique: true });
packageschema.index({
  isActive: 1,
});
export default packageschema;
