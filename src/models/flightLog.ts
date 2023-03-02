import { model } from "mongoose";
import flightLogSchema, { IFlightLog } from "../schemas/flightLog";

const flightLog = model<IFlightLog>("flightLog", flightLogSchema);

export default flightLog;
