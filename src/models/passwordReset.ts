import mongoose from "mongoose";

import PassResetSchema, { IPassReset } from "../schemas/passwordReset";

const PassReset = mongoose.model<IPassReset>("password_reset", PassResetSchema);
export default PassReset;
