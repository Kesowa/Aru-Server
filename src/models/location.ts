import mongoose from "mongoose";
import locationSchema, { ILocation } from "../schemas/location";

const Location = mongoose.model<ILocation>("location", locationSchema);

export default Location;
