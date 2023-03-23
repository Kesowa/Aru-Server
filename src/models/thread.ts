import mongoose from "mongoose";
import { IThread, ThreadSchema } from "../schemas/thread";

export const Thread = mongoose.model<IThread>("thread", ThreadSchema);
