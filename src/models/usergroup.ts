import mongoose from "mongoose";
import usergroupSchema, { IUserGroup } from "../schemas/usergroup";

const UserGroup = mongoose.model<IUserGroup>("usergroup", usergroupSchema);

export default UserGroup;
