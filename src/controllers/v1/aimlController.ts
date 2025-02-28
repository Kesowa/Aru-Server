import { Request } from "express";
import { AuthResponse } from "../../utils/interfaceUtils";
import VOD from "../../models/vod";
import aimlModel from "../../models/aimlTask";
import Layer from "../../models/layer";
import moment from "moment";
import { notificationSocket } from "../../socket";
import { sendInfer } from "../../utils/inferUtils";
import { logger } from "../../app";

export const inferVodViolence = async (
  req: Request<{ vodId: string; inferType: string }>,
  res: AuthResponse
) => {
  req.log.info(`Processing VOD with ID: ${req.params.vodId}`);

  const { vodId, inferType } = req.params;

  const vod = await VOD.findOne({
    _id: vodId,
    tenantId: res.locals.user.tenantId._id,
  });
  if (!vod?.originalFile) {
    res.status(404).json({
      status: false,
      message: "vod not found",
    });
    return;
  }
  const oldTask = await aimlModel.findOne({
    doc: vod._id,
    docModel: "vod",
    infer: inferType,
    tenant: res.locals.user.tenantId._id,
  });
  let hadFailed = false;
  if (oldTask !== null) {
    if (oldTask.status == "started") {
      const start = moment(oldTask.updatedAt);
      const end = moment(new Date());
      const diff = moment.duration(end.diff(start));
      const hours = diff.asHours();
      if (hours < 1) {
        res.status(202).json({
          status: true,
          message: "task running",
        });
        return;
      } else {
        hadFailed = true;
      }
    }
    if (oldTask.status == "completed") {
      res.status(208).json({
        status: true,
        message: "task completed",
      });
      return;
    }
    if (oldTask.status == "failed") {
      hadFailed = true;
    }
  }
  const mp4 = vod.originalFile;
  const newTask = hadFailed
    ? oldTask
    : await aimlModel.create({
        doc: vod._id,
        docModel: "vod",
        status: "started",
        infer: inferType,
        createdBy: res.locals.user._id,
        updatedBy: res.locals.user._id,
        tenant: res.locals.user.tenantId._id,
        data: "null",
      });
  try {
    await sendInfer(mp4, inferType, {
      mission_id: newTask.doc._id.toString(),
      tenant_id: newTask.tenant.toString(),
      user_id: newTask.createdBy.toString(),
      infer_id: newTask._id.toString(),
      doc_id: vod._id.toString(),
    });
    res.status(201).json({
      status: true,
      message: hadFailed ? "task restarted" : "task started",
    });
    notificationSocket
      .to(newTask.tenant.toHexString())
      .emit("AI_TASK", newTask);
    return;
  } catch (err) {
    await newTask.updateOne({ status: "failed" });
    req.log.error(err, "ai server request failed");
    res.status(500).json({
      status: false,
      message: "Server error",
    });
    return;
  }
};

export const inferLayerProcessing = async (
  req: Request<{ layerId: string; inferType: string }>,
  res: AuthResponse
) => {
  logger.info(req, "SENT INFERENCE REQUEST");

  const { layerId, inferType } = req.params;

  const layer = await Layer.findOne({
    _id: layerId,
    tenantId: res.locals.user.tenantId._id,
  });
  if (layer === null) {
    res.status(404).json({
      status: false,
      message: "Layer not found",
    });
    return;
  }

  const oldTask = await aimlModel.findOne({
    doc: layer._id,
    docModel: "layer",
    infer: inferType,
    tenant: res.locals.user.tenantId._id,
  });
  let hadFailed = false;

  if (oldTask !== null) {
    if (oldTask.status == "started") {
      const start = moment(oldTask.updatedAt);
      const end = moment(new Date());
      const diff = moment.duration(end.diff(start));
      const hours = diff.asHours();
      if (hours < 1) {
        res.status(202).json({
          status: true,
          message: "Task is already running",
        });
        return;
      } else {
        hadFailed = true;
      }
    }

    if (oldTask.status == "completed") {
      res.status(208).json({
        status: true,
        message: "Task is already completed",
      });
      return;
    }

    if (oldTask.status == "failed") {
      hadFailed = true;
    }
  }

  const newTask = hadFailed
    ? oldTask
    : await aimlModel.create({
        doc: layer._id,
        docModel: "layer",
        status: "started",
        infer: inferType,
        createdBy: res.locals.user._id,
        updatedBy: res.locals.user._id,
        tenant: res.locals.user.tenantId._id,
        data: "null",
      });

  try {
    await sendInfer(layer.layerpath, inferType, {
      mission_id: newTask.doc._id.toString(),
      tenant_id: newTask.tenant.toString(),
      user_id: newTask.createdBy.toString(),
      infer_id: newTask._id.toString(),
      doc_id: layer._id.toString(),
    });

    res.status(201).json({
      status: true,
      message: hadFailed ? "Task restarted" : "Task started",
    });

    notificationSocket
      .to(newTask.tenant.toHexString())
      .emit("AI_TASK", newTask);

    return;
  } catch (err) {
    await newTask.updateOne({ status: "failed" });
    req.log.error(err, "AI server request failed");
    res.status(500).json({
      status: false,
      message: "Server error",
    });
    return;
  }
};

export const fetchAimlTasks = async (
  req: Request<
    {
      docModel: string;
      docId: string;
    },
    {},
    {},
    { infer?: string[] }
  >,
  res: AuthResponse
) => {
  const query = {
    docModel: req.params.docModel,
    doc: req.params.docId,
    $or: [
      { tenant: res.locals.user.tenantId._id },
      { createdBy: res.locals.user._id },
      { updatedBy: res.locals.user._id },
    ],
  };
  if (req.query.infer) query["infer"] = req.query.infer;

  const tasks = await aimlModel.find(query);

  if (tasks) {
    res.status(200).json({
      status: true,
      message: "ai tasks found",
      data: tasks,
    });
  } else {
    res.status(404).json({
      status: false,
      message: "ai tasks not found",
    });
  }
};
