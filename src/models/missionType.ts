import mongoose from "mongoose";

import missionTypeSchema, { IMissionType } from "../schemas/missonType";

const MissionType = mongoose.model<IMissionType>(
  "missiontype",
  missionTypeSchema
);

export default MissionType;
