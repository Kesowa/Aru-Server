import { model } from "mongoose";
import flightLogSchema, {
  FlightLogModel,
  IFlightLog,
} from "../schemas/flightLog";

const flightLog = model<IFlightLog, FlightLogModel>(
  "flightLog",
  flightLogSchema
);

export default flightLog;
