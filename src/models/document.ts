import mongoose from "mongoose";
import documentSchema, { IDocument } from "../schemas/document";

const Document = mongoose.model<IDocument>("document", documentSchema);

export default Document;
