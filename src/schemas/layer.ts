import mongoose from "mongoose";
import Mission from "../models/mission";
import Tenant from "../models/tenant";
import { Types } from "ts-openapi";
import { rasterProps } from "./rasterprops";
import { vectorProps } from "./vectorprops";
import { deletePublicFileUsingPath } from "../utils/fileDeleteUtils";
import LayerFiles from "../models/layerFiles";
import LayerGroup from "../models/layerGroup";
import { delete3DTiles } from "../utils/cesium";
import { deleteFeatureSearchIndex } from "../utils/dataUtils";

interface ILayerMethods {
  create(): Promise<ILayer>;
  updateFile(newPath: string, newSize: number): Promise<ILayer>;
  delete(): Promise<void>;
}

export type LayerModel = mongoose.Model<ILayer, {}, ILayerMethods>;
export interface ILayer {
  _id: mongoose.Types.ObjectId;
  type: "Vector" | "Raster"; // index
  raster: rasterProps;
  vector: vectorProps;
  missionId: mongoose.Types.ObjectId; // index
  tenantId: mongoose.Types.ObjectId; // index
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  layerGroupId: mongoose.Types.ObjectId;
  captureDate: Date;
  color: string;
  layerpath: string;
  name: string;
  // layerdataArr: [{}]; // stored minp/maxp for baselayers and being used on frontend
  //here why arent we creating an array
  center: [{}];
  minp: number;
  maxp: number;
  featureCount: number;
  layers?: mongoose.Types.ObjectId[];
  layerLabel?: string;
  layerPopupLabel?: string;
  isPublic: boolean; // index
  publicMapRef?: string;
  isBase: boolean;
  fileSize: number;
  flaggedFeatures: number[];
  isFlagged: boolean;
  isThreadExist: boolean;
  commentCount: number;
  createdAt: Date; // index
  updatedAt: Date;
  metadata?: { [key: string]: any };
}
export const LayerType = {
  _id: Types.String(),
  type: Types.StringEnum({ values: ["Vector", "Raster"] }), // index
  raster: Types.StringEnum({ values: Object.values(rasterProps) }),
  vector: Types.StringEnum({ values: Object.values(vectorProps) }),
  missionId: Types.String(), // index
  tenantId: Types.String(), // index
  createdBy: Types.String(),
  updatedBy: Types.String(),
  layerGroupId: Types.String(),
  captureDate: Types.DateTime(),
  color: Types.String(),
  layerpath: Types.String(),
  name: Types.String(),
  // layerdataArr: Types.Array({ arrayType: Types.Object({ properties: {} }) }),
  center: Types.Object({
    properties: { lng: Types.Number(), lat: Types.Number() },
  }),
  minp: Types.Number(),
  maxp: Types.Number(),
  featureCount: Types.Number(),
  layers: Types.Array({ arrayType: Types.String() }),
  layerLabel: Types.String(),
  isPublic: Types.Boolean(), // index
  publicMapRef: Types.String(),
  isBase: Types.Boolean(),
  fileSize: Types.Number(),
  flaggedFeatures: Types.Array({ arrayType: Types.Number() }),
  isFlagged: Types.Boolean(),
  createdAt: Types.DateTime(), // index
  updatedAt: Types.DateTime(),
  metadata: Types.Object({
    properties: {},
  }),
};
const layerSchema = new mongoose.Schema<ILayer>(
  {
    name: {
      type: String,
    },
    type: {
      type: String,
      enum: ["Vector", "Raster"],
    },
    raster: {
      type: String,
      enum: Object.values(rasterProps),
    },
    vector: {
      type: String,
      enum: Object.values(vectorProps),
    },
    layerpath: {
      type: String,
    },
    // layerdataArr: {
    //   type: [{}],
    // },
    color: {
      type: String,
    },
    minp: {
      type: Number,
    },
    maxp: {
      type: Number,
    },
    featureCount: {
      type: Number,
    },
    layers: {
      type: [mongoose.Schema.Types.ObjectId],
      required: false,
    },
    layerLabel: {
      type: String,
      require: false,
    },
    layerPopupLabel: {
      type: String,
      require: false,
    },
    isPublic: {
      type: Boolean,
      default: false,
      require: true,
    },
    publicMapRef: {
      type: String,
    },
    isBase: {
      type: Boolean,
      default: false,
      require: true,
    },
    center: {
      lng: {
        type: Number,
      },
      lat: {
        type: Number,
      },
      required: false,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    captureDate: {
      type: Date,
    },
    missionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "mission",
    },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tenant",
    },
    layerGroupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "layerGroup",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    flaggedFeatures: {
      type: [Number],
      required: true,
      default: [],
    },
    isFlagged: {
      type: Boolean,
      required: true,
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
    createdAt: {
      type: Date,
    },
    updatedAt: {
      type: Date,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);
layerSchema.index({
  missionId: 1,
  tenantId: 1,
  createdAt: 1,
  type: 1,
  isPublic: 1,
});
layerSchema.methods.create = async function () {
  const doc = this as ILayer & mongoose.Document;
  // update size details
  await Tenant.updateOne(
    { _id: doc.tenantId },
    {
      $inc: {
        actualSize: doc.fileSize,
        allLayerSize: doc.fileSize,
        actualLayerCount: 1,
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
layerSchema.methods.updateFile = async function (
  newPath: string,
  newSize: number
) {
  const doc = this as ILayer & mongoose.Document;
  const oldSize = doc.fileSize;
  const oldPath = doc.layerpath;
  // update the layer
  doc.layerpath = newPath;
  doc.fileSize = newSize;
  await doc.save();
  // update size details
  await Tenant.updateOne(
    { _id: doc.tenantId },
    {
      $inc: {
        actualSize: doc.fileSize - oldSize,
        allLayerSize: doc.fileSize - oldSize,
      },
    }
  );
  await Mission.updateOne(
    { _id: doc.missionId },
    { $inc: { size: doc.fileSize - oldSize } }
  );
  // delete old file
  await deletePublicFileUsingPath(oldPath);
  return doc;
};
layerSchema.methods.delete = async function () {
  const doc = this as ILayer & mongoose.Document;

  // delete layer associated files
  if (doc.type == "Vector") {
    // delete and update layerFiles
    const files = await LayerFiles.find({
      layerId: doc._id,
    });
    for (const f of files) {
      await f.delete();
      doc.fileSize -= f.fileSize;
    }
    await LayerFiles.updateMany(
      { layers: doc._id },
      { $pull: { layers: doc._id } }
    );
    // delete geojson
    await deletePublicFileUsingPath(doc.layerpath);
  } else {
    // delete extra files for cesium 3D layer
    if (
      doc.raster == rasterProps.CESIUM_3D &&
      typeof doc.metadata === "string"
    ) {
      await delete3DTiles(doc.metadata);
    }
    // delete raster file
    await deletePublicFileUsingPath(doc.layerpath);
  }

  // delete search index for public layers
  if (doc.isPublic) {
    await deleteFeatureSearchIndex(doc.layerpath);
  }

  // update layer group
  if (doc.layerGroupId) {
    await LayerGroup.updateOne(
      { _id: doc._id, tenantId: doc.tenantId },
      { $pull: { layers: doc._id } },
      { useFindAndModify: false }
    );
  }

  // update size details
  await Tenant.updateOne(
    { _id: doc.tenantId },
    {
      $inc: {
        actualSize: -doc.fileSize,
        allLayerSize: -doc.fileSize,
        actualLayerCount: -1,
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
export default layerSchema;
