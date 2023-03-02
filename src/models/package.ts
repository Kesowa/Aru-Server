import mongoose from "mongoose";
import packageSchema, { IPackage } from "../schemas/package";

const Package = mongoose.model<IPackage>("package", packageSchema);

export default Package;
