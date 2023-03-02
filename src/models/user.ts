import mongoose from "mongoose";
import userSchema, { IUser, UserModel } from "../schemas/user";

const User = mongoose.model<IUser, UserModel>("user", userSchema);

export default User;
