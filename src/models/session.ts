import { model } from "mongoose";
import { sessionSchema, ISession } from "../schemas/session";

export const sessionModel = model<ISession>("session", sessionSchema);
