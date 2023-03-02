import mongoose from "mongoose";
import permissionschema, { IPermission } from "../schemas/permission";

const Permission = mongoose.model<IPermission>("permission", permissionschema);

export default Permission;
