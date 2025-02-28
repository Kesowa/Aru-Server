import { AuthResponse } from "../../utils/interfaceUtils";
import { Request } from "express";
import { isValidObjectId, Types, Model } from "mongoose";
import Mission from "../../models/mission";
import Document from "../../models/document";
import Alert from "../../models/alert";

// add models with missionId and fileSize here
const ModelMap = new Array<
  [string, Model<any>]
>();
ModelMap.push(["document", Document]);
ModelMap.push(["alert", Alert]);

export const getMemoryUsage = async (req: Request, res: AuthResponse) => {
  const missionID = req.params.id;
  if (!isValidObjectId(missionID)) {
    return res.status(400).json({
      status: false,
      message: "invalid mission id",
    });
  }

  const missionDoc = await Mission.findOne({
    _id: missionID,
    tenantId: res.locals.user.tenantId._id,
  });
  if (!missionDoc) {
    return res.status(404).json({
      status: false,
      message: "mission not found",
    });
  }

  const mongoPromises = ModelMap.map(async ([label, model]) => {
    const [memory] = await model.aggregate<{ totalSize: number }>([
      { $match: { missionId: new Types.ObjectId(missionID) } },
      { $group: { _id: null, totalSize: { $sum: "$fileSize" } } },
      { $project: { _id: 0, totalSize: 1 } },
    ]);
    return [label, memory?.totalSize];
  });
  const resolved = await Promise.all(mongoPromises);
  return res.json({
    status: true,
    message: "mission data usage",
    data: resolved,
  });
};
