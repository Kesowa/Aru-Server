import { Request } from "express";
import MissionType from "../../models/missionType";
import { AuthResponse } from "../../utils/interfaceUtils";

//create mission type
export const createMissionType = async (req: Request, res: AuthResponse) => {
  const missionType = new MissionType({
    name: req.body.name,
    description: req.body.description,
    createdBy: res.locals.user._id,
    updatedBy: res.locals.user._id,
    isActive: true,
  });
  const data = await missionType.save();
  res.status(201).json({
    status: true,
    message: "mission type created.",
    data,
  });
};

//edit mission type
export const editMissionType = async (req: Request, res: AuthResponse) => {
  const missionType = await MissionType.findByIdAndUpdate(
    req.body._id,
    {
      name: req.body.name,
      description: req.body.description,
      updatedBy: res.locals.user._id,
      isActive: req.body.isActive ? req.body.isActive : true,
    },
    { new: true }
  );

  res.json({
    status: true,
    message: "mission type editted",
    data: missionType,
  });
};

//dellete mission type
export const deleteMissionType = async (req: Request, res: AuthResponse) => {
  await MissionType.deleteOne({ _id: req.body._id });

  res.json({
    status: true,
    message: "mission type deleted",
  });
};

//fetch all missions
export const fetchAllMissionTypes = async (req: Request, res: AuthResponse) => {
  const missions = await MissionType.find({ isActive: true });
  res.json({
    status: true,
    message: "Missions fetched sucessfully.",
    data: missions,
  });
};
