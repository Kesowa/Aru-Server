import { model } from "mongoose";
import { UploadTask, UploadTaskSchema } from "../schemas/uploadTask";
const uploadModel = model<UploadTask>("uploadTask", UploadTaskSchema);
export default uploadModel;
