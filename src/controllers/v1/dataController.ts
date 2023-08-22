import { Request } from "express";
import { AuthResponse } from "../../utils/interfaceUtils";
import path from "path";
import Alert from "../../models/alert";
import Document from "../../models/document";
import { saveThermal } from "../../utils/imageUtils";
import { Directory, docPath } from "../../utils/pathUtils";

export const genThermal = async (
  req: Request<{}, {}, { id: string; doc: "alerts" | "documents" }>,
  res: AuthResponse
) => {
  const [doc, filePath] = await (async () => {
    if (req.body.doc == "alerts") {
      const doc = await Alert.findById(req.body.id);
      return [doc, doc.image];
    } else if (req.body.doc == "documents") {
      const doc = await Document.findById(req.body.id);
      if (doc.folderName == "photos") {
        return [doc, doc.filePath];
      }
      return null;
    }
  })();
  if (!doc) {
    res.status(404).json({
      status: false,
      message: "doc not found",
    });
    return;
  }
  const fileName = path.parse(filePath).name + ".raw";
  const rawFilePath = docPath(Directory.AI_ML, fileName);
  if (doc.thermalStatus == "failed") {
    res.status(503).json({
      status: false,
      message: "cannot convert",
    });
    return;
  } else if (doc.thermalStatus == "converted") {
    res.status(200).json({
      status: true,
      message: "already converted",
      rawFilePath,
    });
    return;
  }
  const thermalImg = await saveThermal(filePath);
  if (thermalImg) {
    await doc.updateOne({ thermalStatus: "converted", $inc: { fileSize: thermalImg.size } });
    res.status(200).json({
      status: true,
      message: "conversion successful",
      thermalPath: thermalImg.thermalPath,
    });
  } else {
    req.log.error("thermal conversion failed");
    await doc.updateOne({ thermalStatus: "failed" });
    res.status(404).json({
      status: false,
      message: "not a thermal image",
    });
  }
};
