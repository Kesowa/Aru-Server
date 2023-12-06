import mongoose from "mongoose";
import { Types } from "ts-openapi";

export interface IThermalPoint {
  _id: mongoose.Types.ObjectId;
  posX: number;
  posY: number;
  color: string;
  temperature: number;
  label: string;
  documentId: mongoose.Types.ObjectId;
}

export const ThermalPointType = {
  _id: Types.String(),
  posX: Types.Number(),
  posY: Types.Number(),
  color: Types.String(),
  temperature: Types.Number(),
  label: Types.Number(),
  documentId: Types.String(),
};

const thermalPointSchema = new mongoose.Schema<IThermalPoint>({
  posX: {
    type: Number,
    required: true,
  },
  posY: {
    type: Number,
    required: true,
  },
  color: {
    type: String,
    required: true,
  },
  temperature: {
    type: Number,
    required: true,
  },
  label: {
    type: String,
    required: true,
  },
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "document",
  },
});

// Two different thermal point documents, belonging to same image, having same position, must not exist. Same position can't have multiple different details.
thermalPointSchema.index({ posX: 1, posY: 1, documentId: 1 }, { unique: true }); // {posX,posY,documentId} set must be unique for all thermal points

// Indexing documentId and position, for optimized queries
thermalPointSchema.index({ posX: 1, posY: 1 });
thermalPointSchema.index({ documentId: 1 });

export default thermalPointSchema;
