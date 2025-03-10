import mongoose from "mongoose";

import documentSchema, { DocumentModel, IDocument } from "../schemas/document";

const Document = mongoose.model<IDocument, DocumentModel>(
  "document",
  documentSchema
);

export default Document;
