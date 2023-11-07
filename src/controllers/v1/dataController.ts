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

export const createThermalPoint = async (
  req: Request<
    {},
    {},
    {
      posX: string;
      posY: string;
      temperature: string;
      color: string;
      documentId: string;
      label: string;
    }
  >,
  res: AuthResponse
) => {
  const { posX, posY, temperature, color, documentId, label } = req.body;
  try {
    const exists = await ThermalPoint.findOne({
      posX: Number(posX),
      posY: Number(posY),
      documentId: new mongoose.Types.ObjectId(documentId),
    });
    if (exists) {
      const doc = await ThermalPoint.findByIdAndUpdate(
        exists._id,
        {
          temperature: Number(temperature),
          color,
          label: label ? label : "",
        },
        { new: true }
      );
      res.status(200).json({
        status: true,
        message: "Thermal Point created!",
        data: doc,
      });
    } else {
      const doc = await ThermalPoint.create({
        posX: Number(posX),
        posY: Number(posY),
        temperature: Number(temperature),
        color,
        label: label ? label : "",
        documentId: new mongoose.Types.ObjectId(documentId),
      });
      res.status(200).json({
        status: true,
        message: "Thermal Point created!",
        data: doc,
      });
    }
  } catch (error) {
    req.log.error(error, "failed to create thermal point");
    res.status(500).json({
      status: false,
      message: "Server Error",
    });
  }
};

export const fetchThermalPoint = async (req: Request, res: AuthResponse) => {
  const posX = Number(req.query.posX);
  const posY = Number(req.query.posY);
  const documentId = new mongoose.Types.ObjectId(String(req.query.documentId));
  try {
    const doc = await ThermalPoint.findOne({ posX, posY, documentId });
    if (doc) {
      res.status(200).json({
        status: true,
        message: "Thermal Point fetched successfully!",
        data: doc,
      });
    } else {
      res.status(404).json({
        status: true,
        message: "Thermal Point not found!",
      });
    }
  } catch (error) {
    req.log.error(error, "failed to fetch thermal point");
    res.status(500).json({
      status: false,
      message: "Server Error",
    });
  }
};

export const deleteThermalPoint = async (
  req: Request<
    {},
    {},
    {
      posX: string;
      posY: string;
      documentId: string;
    }
  >,
  res: AuthResponse
) => {
  const posX = Number(req.body.posX);
  const posY = Number(req.body.posY);
  const documentId = new mongoose.Types.ObjectId(String(req.body.documentId));
  try {
    await ThermalPoint.findOneAndDelete({ posX, posY, documentId });
    res.status(200).json({
      status: true,
      message: "Thermal Point deleted successfully!",
    });
  } catch (error) {
    req.log.error(error, "failed to delete thermal point");
    res.status(500).json({
      status: false,
      message: "Server Error",
    });
  }
};

export const fetchAllThermalPointsForImage = async (
  req: Request,
  res: AuthResponse
) => {
  const documentId = new mongoose.Types.ObjectId(String(req.query.documentId));
  try {
    const docs = await ThermalPoint.find({ documentId });
    res.status(200).json({
      status: true,
      message: "Thermal Points fetched successfully!",
      data: docs,
    });
  } catch (error) {
    req.log.error(error, "failed to fetch thermal points");
    res.status(500).json({
      status: false,
      message: "Server Error",
    });
  }
};

export const deleteAllThermalPointsForImage = async (
  req: Request<{}, {}, { documentId: string }>,
  res: AuthResponse
) => {
  const documentId = new mongoose.Types.ObjectId(String(req.body.documentId));
  try {
    await ThermalPoint.deleteMany({ documentId });
    res.status(200).json({
      status: true,
      message: "Thermal Points deleted successfully!",
    });
  } catch (error) {
    req.log.error(error, "failed to delete thermal points");
    res.status(500).json({
      status: false,
      message: "Server Error",
    });
  }
};
