import mongoose from "mongoose";
import Mission from "../models/mission";
import Tenant from "../models/tenant";
import { Types } from "ts-openapi";
import { deleteThumbnails, saveThumbnails } from "../utils/imageUtils";
import { deletePublicFileUsingPath } from "../utils/fileDeleteUtils";

interface IAlertMethods {
  create(): Promise<IAlert>;
  delete(): Promise<void>;
}

export type AlertModel = mongoose.Model<IAlert, {}, IAlertMethods>;

export interface IAlert {
  _id: mongoose.Types.ObjectId;
  missionId: mongoose.Types.ObjectId; // index
  location: {
    long: number;
    lat: number;
  };
  isFlagged: boolean;
  isThreadExist: boolean;
  commentCount: number;
  locationName: string;
  fileSize: number;
  note: string;
  createdBy: mongoose.Types.ObjectId;
  onSite: boolean;
  flightId: mongoose.Types.ObjectId; // index
  tenantId: mongoose.Types.ObjectId; // index
  pcount: number; // People count
  type: "Manual" | "Automated" | "Android"; // index
  image: string;
  locationId?: mongoose.Types.ObjectId; // index
  createdAt: Date;
  updatedAt: Date;
}
export const AlertType = {
  _id: Types.String(),
  missionId: Types.String(), // index
  location: {
    long: Types.Number(),
    lat: Types.Number(),
  },
  isFlagged: Types.Boolean(),
  isThreadExist: Types.Boolean(),
  commentCount: Types.Number(),
  locationName: Types.String(),
  fileSize: Types.Number(),
  note: Types.String(),
  createdBy: Types.String(),
  onSite: Types.Boolean(),
  flightId: Types.String(), // index
  tenantId: Types.String(), // index
  pcount: Types.Number(), // People count
  type: Types.StringEnum({ values: ["Manual", "Automated", "Android"] }), // index
  image: Types.String(),
  locationId: Types.String(), // index
  createdAt: Types.DateTime(),
  updatedAt: Types.DateTime(),
};
const alertSchema = new mongoose.Schema<IAlert>(
  {
    location: {
      long: {
        type: Number,
        required: false,
      },
      lat: {
        type: Number,
        required: false,
      },
    },
    fileSize: {
      type: Number,
    },
    missionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "mission",
      required: true,
    },
    isFlagged: {
      type: Boolean,
      default: false,
    },
    isThreadExist: {
      type: Boolean,
      default: false,
    },
    commentCount: {
      type: Number,
      default: 0,
    },
    locationName: {
      type: String,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    locationId: {
      type: mongoose.Schema.Types.Mixed,
      ref: "location",
      required: false,
    },
    flightId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "flight",
      required: true,
    },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tenant",
      required: true,
    },
    pcount: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      default: "Manual",
      enum: ["Manual", "Automated", "Android"],
    },
    image: {
      type: String,
      required: true,
    },
    note: {
      type: String,
    },
    onSite: {
      type: Boolean,
      default: false,
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
alertSchema.index({
  flightId: 1,
  missionId: 1,
  tenantId: 1,
  type: 1,
});
alertSchema.index({ locationId: 1 }, { sparse: true });
alertSchema.methods.create = async function () {
  const doc = this as IAlert & mongoose.Document;
  // generate thumbnails
  const thumbs = await saveThumbnails(doc.image);
  doc.fileSize += thumbs.size;
  await doc.save();
  // update size details
  await Tenant.updateOne(
    { _id: doc.tenantId },
    {
      $inc: {
        actualSize: doc.fileSize,
        allAlertSize: doc.fileSize,
        actualAlertCount: 1,
      },
    }
  );
  await Mission.updateOne(
    { _id: doc.missionId },
    { $inc: { size: doc.fileSize } }
  );
  // save the document
  return await doc.save();
};
alertSchema.methods.delete = async function () {
  const doc = this as IAlert & mongoose.Document;
  // delete thumbnails
  await deleteThumbnails(doc.image);
  // delete actual file
  await deletePublicFileUsingPath(doc.image);
  // update size details
  await Tenant.updateOne(
    { _id: doc.tenantId },
    {
      $inc: {
        actualSize: -doc.fileSize,
        allAlertSize: -doc.fileSize,
        actualAlertCount: -1,
      },
    }
  );
  await Mission.updateOne(
    { _id: doc.missionId },
    { $inc: { size: -doc.fileSize } }
  );
  // delete the document
  await doc.deleteOne();
};
export default alertSchema;
