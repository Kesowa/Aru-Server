import { model } from "mongoose";
import VODSchema, { IVOD } from "../schemas/VOD";

const VOD = model<IVOD>("VOD", VODSchema);

export default VOD;
