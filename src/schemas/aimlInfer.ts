import { Schema, Types } from "mongoose";

const inferenceModels = <const>[
  { name: "violence", target: "video" },
  { name: "deepforest", target: "tiff" },
];
export type inferenceTypes = typeof inferenceModels[number];

export type IAimlInfer = {
  _id: Types.ObjectId;
  name: string;
  description: string;
  model: inferenceTypes;
};

export const AimlInfer = new Schema<IAimlInfer>({
  name: String,
  description: String,
  model: {
    type: {
      name: String,
      target: String,
    },
  },
});
