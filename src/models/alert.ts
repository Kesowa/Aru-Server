import mongoose from "mongoose";

import alertSchema, { AlertModel, IAlert } from "../schemas/alert";

export const Alert = mongoose.model<IAlert, AlertModel>("alert", alertSchema);

export default Alert;
