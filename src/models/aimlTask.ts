import { model } from "mongoose";

import { IAimlTask, AimlTaskSchema } from "../schemas/aimlTask";
const aimlModel = model<IAimlTask>("aimlTask", AimlTaskSchema);
export default aimlModel;
