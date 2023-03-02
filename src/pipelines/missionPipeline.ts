import { Types, PipelineStage } from "mongoose";

export const missionByLocationPipe = (
  locationID: string,
  missionId: string,
  tenantID: string
) => {
  return [
    {
      $match: {
        locationID: new Types.ObjectId(locationID),
        mission: new Types.ObjectId(missionId),
        tenant: new Types.ObjectId(tenantID),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "pilotID",
        foreignField: "_id",
        as: "pilot",
      },
    },
    {
      $lookup: {
        from: "missions",
        localField: "mission",
        foreignField: "_id",
        as: "missions",
      },
    },
    {
      $lookup: {
        from: "alerts",
        localField: "mission",
        foreignField: "missionId",
        as: "Alerts",
      },
    },
    {
      $lookup: {
        from: "vods",
        localField: "mission",
        foreignField: "missionID",
        as: "vods",
      },
    },
    {
      $project: {
        _id: 0,
        missionID: "$mission",
        flightID: "$_id",
        flightDate: "$date",
        centerPoints: "$centerPoints",
        orderDate: {
          $arrayElemAt: ["$missions.createdAt", 0],
        },
        geoLocation: 1,
        totalAlerts: {
          $size: "$Alerts",
        },
        totalVideos: {
          $size: "$vods",
        },
        pilotName: {
          $arrayElemAt: ["$pilot.name", 0],
        },
        pilotAvatar: {
          $arrayElemAt: ["$pilot.avatar", 0],
        },
      },
    },
    {
      $sort: {
        orderDate: -1,
      },
    },
  ] as PipelineStage[];
};

export const getNumberOfTypesOfMissions = (tenantId: any) => {
  return [
    {
      $match: {
        tenantId: new Types.ObjectId(tenantId),
      },
    },
    {
      $group: {
        _id: "$status",
        count: {
          $sum: 1,
        },
      },
    },
  ];
};
