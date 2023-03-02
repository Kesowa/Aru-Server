import mongoose from "mongoose";
import alertSchema, { IAlert } from "../schemas/alert";

export const Alert = mongoose.model<IAlert>("alert", alertSchema);

export default Alert;
