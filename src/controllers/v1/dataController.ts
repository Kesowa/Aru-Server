import { Request } from "express";
import { AuthResponse } from "../../utils/interfaceUtils";
import { Directory, DirPath } from "../../constants";
import path from "path";
import { exec } from "child_process";
import Alert from "../../models/alert";
import Document from "../../models/document";
import aimlModel from "../../models/aimlTask";

export const getThermal = async (
  req: Request<{}, {}, { id: string; doc: "alerts" | "documents" }>,
  res: AuthResponse
) => {
  let thermalDoc = await aimlModel.findOne({
    doc: req.query.id,
    docModel: req.query.doc,
    infer: "thermal",
  });
  if (thermalDoc) {
    if (thermalDoc.status == "failed") {
      res.status(404).json({
        status: false,
        message: "cannot convert",
      });
      return;
    } else {
      res.json({
        status: true,
        message: "already converted",
        data: thermalDoc,
      });
      return;
    }
  }
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
        }
      );
    });
    thermalDoc = await aimlModel.create({
      doc: req.query.id,
      docModel: req.query.doc,
      infer: "thermal",
      status: "completed",
      createdBy: res.locals.user._id,
      updatedBy: res.locals.user._id,
      tenant: res.locals.user.tenantId._id,
      data: {
        file: rawFilePath,
        table: [],
      },
    });
    res.json({
      status: true,
      message: "conversion successful",
      data: thermalDoc,
    });
  } catch (err) {
    req.log.error(err, "thermal conversion failed");
    thermalDoc = await aimlModel.create({
      doc: req.query.id,
      docModel: req.query.doc,
      infer: "thermal",
      status: "failed",
      createdBy: res.locals.user._id,
      updatedBy: res.locals.user._id,
      tenant: res.locals.user.tenantId._id,
      data: null,
    });
    res.status(404).json({
      status: false,
      message: "not a thermal image",
      data: thermalDoc,
    });
  }
};

const checkUint = (num) =>
  typeof num == "number" && Number.isInteger(num) && num >= 0;
const checkFloat = (num) => typeof num == "number";
const colorReg = /^#[0-9a-f]{3,6}#/i;
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
  if (thermalDoc.infer == "thermal") thermalDoc.data.table = realTable;
  await thermalDoc.save();
  res.json({
    status: true,
    message: "thermal table updated",
    data: thermalDoc,
  });
};
