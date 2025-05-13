import mongoose from "mongoose";

import iconSchema, { IconModel, IIcon } from "../schemas/icon";

export const Icon = mongoose.model<IIcon, IconModel>("icon", iconSchema);

export default Icon;
