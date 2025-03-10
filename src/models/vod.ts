import { model } from "mongoose";

import VODSchema, { IVOD, VODModel } from "../schemas/VOD";

const VOD = model<IVOD, VODModel>("VOD", VODSchema);

export default VOD;
