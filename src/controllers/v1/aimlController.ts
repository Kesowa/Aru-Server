import { Request } from "express";
import { AuthResponse } from "../../utils/interfaceUtils";
import {
  AIML_SERVER,
  API_SERVER,
  CDN_URL,
  Directory,
} from "../../constants";
import VOD from "../../models/vod";
import aimlModel from "../../models/aimlTask";
import { IVOD } from "../../schemas/VOD";
import { HydratedDocument } from "mongoose";
import fetch from "node-fetch";
import moment from "moment";
import { notificationSocket } from "../../socket";
import { saveAIMLFile } from "../../utils/dataUtils";

export const inferVodViolence = async (
  req: Request<{ vodId: string }>,
  res: AuthResponse
) => {
  const vod = await VOD.findOne({
    _id: req.params.vodId,
    tenantId: res.locals.user.tenantId._id,
  });
  if (vod === null) {
    res.status(404).json({
      status: false,
      message: "vod not found",
    });
    return;
  }
  const oldTask = await aimlModel.findOne({
    doc: vod._id,
    docModel: "vod",
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
      // res.status(505).json({
      //   status: false,
      //   message: "task failed"
      // });
      // return;
    }
  }
  const mp4 = vod.videoPath.replace(/m3u8$/, "flv");
  const newTask = hadFailed
    ? oldTask
    : await aimlModel.create({
        doc: vod._id,
        docModel: "vod",
        status: "started",
        infer: "violence",
        createdBy: res.locals.user._id,
        updatedBy: res.locals.user._id,
        tenant: res.locals.user.tenantId._id,
        data: "null",
      });
  const body = {
    inference: "violence",
    target: CDN_URL + mp4,
    callback: `${API_SERVER}/apis/v1/aiml/vod/${newTask._id.toHexString()}/violence/callback`,
  };
  try {
    const aiServerResponse = await fetch(AIML_SERVER + "/video/violence", {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "content-type": "application/json",
      },
    });
    if (aiServerResponse.ok) {
      res.status(201).json({
        status: true,
        message: hadFailed ? "task restarted" : "task started",
      });
      notificationSocket
        .to(newTask.tenant.toHexString())
        .emit("AI_TASK", newTask);
      return;
    } else {
      res.status(505).json({
        status: false,
        message: "unable to start task",
      });
      return;
    }
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
export const callbackVodViolence = async (
  req: Request<
    { taskId: string },
    {
      Keys: string[];
      Values: [number, number][];
    }
  >,
  res: AuthResponse
) => {
  const task = await aimlModel
    .findById(req.params.taskId)
    .populate<{ doc: HydratedDocument<IVOD> }>("doc");
  if (task === null) {
    res.status(404).json({
      status: false,
      message: "task not found",
    });
    return;
  }
  if (task.status == "completed") {
    res.status(408).json({
      status: false,
      message: "task already completed",
    });
    return;
  }
  const filename = `${task.infer}_${task._id}.json`;
  await saveAIMLFile(filename, JSON.stringify(req.body));
  task.status = "completed";
  task.data = `${Directory.AI_ML}/${filename}`;
  await task.save();
  notificationSocket.to(task.tenant.toHexString()).emit("AI_TASK", task);
  res.status(201).json({
    status: true,
    message: "task successfully completed",
  });
  return;
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
    tenant: res.locals.user.tenantId._id,
  };
  if (req.query.infer) query["infer"] = req.query.infer;

  const tasks = await aimlModel.find();
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
