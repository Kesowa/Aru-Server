import mongoose from "mongoose";
import missionSchema, { IMission } from "../schemas/mission";

const Mission = mongoose.model<IMission>("mission", missionSchema);

export default Mission;
