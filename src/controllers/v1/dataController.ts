import { Request } from "express";
import { AuthResponse } from "../../utils/interfaceUtils";
import path from "path";
import Alert from "../../models/alert";
import Document from "../../models/document";
import { saveThermal } from "../../utils/imageUtils";
import aimlModel from "../../models/aimlTask";
import { HydratedDocument } from "mongoose";
import { IAlert } from "../../schemas/alert";
import { IDocument } from "../../schemas/document";

export const getThermal = async (
  req: Request<{}, {}, { id: string; doc: "alert" | "document" }>,
  res: AuthResponse
) => {
  const thermalDoc = await aimlModel.findOneAndUpdate(
    {
      doc: req.query.id,
      docModel: req.query.doc,
      infer: "thermal",
    },
    {
      $setOnInsert: {
        doc: req.query.id,
        docModel: req.query.doc,
        infer: "thermal",
        status: "started",
        createdBy: res.locals.user._id,
        updatedBy: res.locals.user._id,
        tenant: res.locals.user.tenantId._id,
        data: {
          file: "",
          table: [],
        },
      },
    },
    {
      upsert: true,
      new: true,
    }
  );
  if (thermalDoc) {
    if (thermalDoc.status == "failed") {
      res.status(404).json({
        status: false,
        message: "cannot convert",
      });
      return;
    } else if (thermalDoc.status == "completed") {
      res.json({
        status: true,
        message: "already converted",
        data: thermalDoc,
      });
      return;
    }
  } else {
    res.status(500).json({
      status: false,
      message: "unable to create thermal doc",
    });
    return;
  }
  let doc: HydratedDocument<IAlert | IDocument>, filePath: string;
  if (req.query.doc == "alert") {
    doc = await Alert.findById(req.query.id);
    filePath = doc.image;
  } else if (req.query.doc == "document") {
    const docx = await Document.findById(req.query.id);
    if (docx.folderName == "photos") {
      doc = docx;
      filePath = doc.filePath;
    }
  }
  if (!doc) {
    res.status(404).json({
      status: false,
      message: "doc not found",
    });
    return;
  }
  const thermalImg = await saveThermal(filePath);
  const converted = thermalImg ? true : false;
  thermalDoc.status = converted ? "completed" : "failed";
  thermalDoc.data.file = converted ? thermalImg.thermalPath : "";
  await thermalDoc.updateOne({
    status: thermalDoc.status,
    "data.file": thermalDoc.data.file,
  });
  res.status(converted ? 200 : 404).json({
    status: converted,
    message: converted ? "conversion successful" : "conversion failed",
    data: thermalDoc,
  });
};

const checkUint = (num) =>
  typeof num == "number" && Number.isInteger(num) && num >= 0;
const checkFloat = (num) => typeof num == "number";
const colorReg = /^#[0-9a-f]{3,6}$/i;
const checkColor = (color) => typeof color == "string" && colorReg.test(color);
const checkTable = (table) => {
  if (Array.isArray(table) && table.length > 0) {
    const correct = table.every(
      ({ x, y, temp, color, label }) =>
        checkUint(x) &&
        checkUint(y) &&
        checkFloat(temp) &&
        checkColor(color) &&
        typeof label == "string"
    );
    if (!correct) {
      return false;
    }
    return table as Array<{
      x: number;
      y: number;
      temp: number;
      color: string;
      label: string;
    }>;
  }
  return false;
};
export const createThermalTable = async (
  req: Request<
    {},
    {},
    {
      id: string;
      doc: string;
      table: unknown;
    }
  >,
  res: AuthResponse
) => {
  const { doc, id, table } = req.body;
  const realTable = checkTable(table);
  if (!realTable) {
    res.status(400).json({
      status: false,
      message: "bad request",
      errors: {
        table: "table format is incorrect",
      },
    });
    return;
  }
  const thermalDoc = await aimlModel.findOne({
    doc: id,
    docModel: doc,
    status: "completed",
    infer: "thermal",
    tenant: res.locals.user.tenantId._id,
  });
  if (!thermalDoc) {
    res.status(404).json({
      status: false,
      message: "thermal doc not found",
    });
    return;
  }
  // always true
  if (thermalDoc.infer == "thermal") {
    await thermalDoc.updateOne({ "data.table": realTable });
    thermalDoc.data.table = realTable;
  }
  res.json({
    status: true,
    message: "thermal table updated",
    data: thermalDoc,
  });
};
