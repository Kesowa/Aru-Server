import mongoose from "mongoose";
import vectorSchema, { IVector } from "../schemas/vectorprops";

const vector = mongoose.model<IVector>("vector", vectorSchema);
export default vector;
