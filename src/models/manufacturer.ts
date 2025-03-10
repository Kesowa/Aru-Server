import mongoose from "mongoose";

import manufacturerSchema, { IManufacturer } from "../schemas/manufacturer";

const manufacturerModel = mongoose.model<IManufacturer>(
  "manufacturer",
  manufacturerSchema
);

export default manufacturerModel;
