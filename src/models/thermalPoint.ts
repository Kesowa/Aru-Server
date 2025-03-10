import mongoose from "mongoose";

import thermalPointSchema, { IThermalPoint } from "../schemas/thermalPoint";

const ThermalPoint = mongoose.model<IThermalPoint>(
  "thermalPoint",
  thermalPointSchema,
);

export default ThermalPoint;
