import mongoose from "mongoose";
import modelSchema, { IModel } from "../schemas/model";

const deviceModel = mongoose.model<IModel>("model", modelSchema);

export default deviceModel;
