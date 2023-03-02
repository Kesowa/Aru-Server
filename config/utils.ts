import { sessionModel } from "../src/models/session";
import User from "../src/models/user";

export const Login = async () => {
  const user = await User.findOne({ email: "admin@NKDA.com" });
  if (!user) throw Error("Login Failed: User Not Found");
  const session = await sessionModel.create({ owner: user._id });
  return session._id.toHexString();
};

export const LoginSuper = async () => {
  const user = await User.findOne({ email: "admin@kesowa.com" });
  if (!user) throw Error("Login Failed: User Not Found");
  const session = await sessionModel.create({ owner: user._id });
  return session._id.toHexString();
};

export const Logout = async () => {
  await sessionModel.deleteMany({});
};

export const clearAllClients = async () => {
  await User.deleteMany({ userType: "tenant-client" });
};

export const CurriedUrl = (base: string) => (relative: string) =>
  `/apis/v1/${base}/${relative}`;
