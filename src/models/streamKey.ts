import { model } from "mongoose";
import streamKeySchema, { IStreamKey } from "../schemas/streamKey";

export const streamKeyModel = model<IStreamKey>("streamKey", streamKeySchema);
