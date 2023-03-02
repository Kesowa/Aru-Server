import mongoose from "mongoose";
export interface IAsset {
  _id: mongoose.Types.ObjectId;
  assetName: string;
  userID: mongoose.Types.ObjectId;
  tenantID: mongoose.Types.ObjectId; // index
  assetInfo: [
    {
      UIN: string;
      FCID: string;
      serialNO: string;
    }
  ];
  manufactureID: mongoose.Types.ObjectId;

  createdBy: mongoose.Types.ObjectId;
  isActive: boolean;
  modelID: mongoose.Types.ObjectId;
  assetOwner: mongoose.Types.ObjectId;
  manufactureDate: Date;
  createdAt: Date;
  updatedAt: Date;
  UIN: string;
  FCID: string;
  serialNo: string;
}
const assetSchema = new mongoose.Schema<IAsset>(
  {
    UIN: String,
    FCID: String,
    serialNo: {
      type: String,
      required: true,
      default: null,
    },
    assetName: {
      type: String,
      required: true,
    },
    assetOwner: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "user",
    },
    modelID: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "model",
    },
    manufactureID: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "manufacturer",
    },
    isActive: {
      type: Boolean,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "user",
    },
    createdAt: {
      type: Date,
      required: true,
    },
    userID: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "user",
    },
    tenantID: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "tenant",
    },
    manufactureDate: {
      type: Date,
      required: true,
    },
    assetInfo: [
      {
        UIN: String,
        FCID: String,
        serialNO: String,
      },
    ],
    updatedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);
assetSchema.index({ tenantID: 1 });
export default assetSchema;
