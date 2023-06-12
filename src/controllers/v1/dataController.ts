import { Request } from "express";
import { AuthResponse } from "../../utils/interfaceUtils";
import { Directory, DirPath, PUBLIC_DIR } from "../../constants";
import path from "path";
import { exec } from "child_process";
import Alert from "../../models/alert";
import Document from "../../models/document";

export const genThermal = async (
  req: Request<{}, {}, { id: string; doc: "alerts" | "documents" }>,
  res: AuthResponse,
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
  const fullPath = DirPath(Directory.DEFAULT, filePath);
  const fileName = path.parse(filePath).name + ".raw";
  const rawFilePath = `/${Directory.AI_ML}/${fileName}`;
  const outPath = DirPath(Directory.AI_ML, fileName);
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
  try {
    await new Promise((res, rej) => {
      exec(
        `dji_irp -s ${fullPath} -a measure --measurefmt float32 -o ${outPath}`,
        (err, sto, ste) => {
          if (err) {
            rej(err);
            req.log.error(ste);
          }
          res(sto);
        },
      );
    });
    await doc.updateOne({ thermalStatus: "converted" });
    res.status(200).json({
      status: true,
      message: "conversion successful",
      rawFilePath,
    });
  } catch (err) {
    req.log.error(err, "thermal conversion failed");
    await doc.updateOne({ thermalStatus: "failed" });
    res.status(404).json({
      status: false,
      message: "not a thermal image",
    });
  }
};
