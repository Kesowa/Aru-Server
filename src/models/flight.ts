import mongoose from "mongoose";
import flightSchema, { IFlight } from "../schemas/flight";

const Flight = mongoose.model<IFlight>("flight", flightSchema);

export default Flight;
