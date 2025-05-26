import { Request } from "express";
import moment from "moment";
import { Types } from "mongoose";

import Alert from "../../models/alert";
import Document from "../../models/document";
import Flight from "../../models/flight";
import Layer from "../../models/layer";
import Location from "../../models/location";
import Mission from "../../models/mission";
import Tenant from "../../models/tenant";
import VOD from "../../models/vod";
import {
  getNumberOfTypesOfMissions,
  missionByLocationPipe,
} from "../../pipelines/missionPipeline";
import { notificationSocket } from "../../socket";
import { saveCSV } from "../../utils/dataUtils";
import { AuthResponse } from "../../utils/interfaceUtils";
import { IMission } from "../../schemas/mission";
import { IUser } from "../../schemas/user";
import { IMissionType } from "../../schemas/missonType";
import { IInvite } from "../../schemas/invite";
import { ILocation } from "../../schemas/location";
import MissionType from "../../models/missionType";
import { escapeRegex } from "../../utils/sanitization";

//create flight controller
type CreateMission = {
  name: string;
  deliverables: string[];
  description: string;
  assetID: string | undefined;
  missionType: string;
  clientId: string[] | undefined;
  flights: {
    "0": {
      flightDetails: {
        locationId: string;
        date: string;
        time: string;
        flightName: string;
        duration: string;
        geoLocation: string;
        centerPoints: {
          lat: number;
          lng: number;
        };
      };
      geoFence: {
        circle: {} | null;
        polygon: {
          area: number;
          length: number;
          points: {
            lat: number;
            lng: number;
          }[];
        } | null;
      };
    };
    assetID: string | undefined;
  };
};
export const createMission = async (
  req: Request<{}, {}, CreateMission>,
  res: AuthResponse,
) => {
  const { name, description, deliverables, assetID, flights } = req.body;

  const data = { name };
  if (deliverables) {
    data["deliverables"] = deliverables;
  }

  if (description) {
    data["description"] = description;
  }

  if (assetID !== "none") {
    data["assetID"] = assetID;
  }
  // Create a new mission
  const newMission = new Mission({
    ...data,
    user: res.locals.user._id,
    tenantId: res.locals.user.tenantId,
    missionType: req.body.missionType,
    clientId: req.body.clientId,
  });
  const mission = await newMission.save();
  const tenant = await Tenant.findOne({
    _id: res.locals.user.tenantId,
  });
  if (mission && tenant.actualMissionCount >= 0) {
    await Tenant.updateOne(
      { _id: res.locals.user.tenantId },
      { $inc: { actualMissionCount: 1 } },
    );
  }
  // Mission id to store with flight
  const missionId = mission._id;

  const {
    flightDetails: {
      locationId,
      flightName,
      date,
      time,
      duration,
      geoLocation,
      centerPoints,
    },
    geoFence = undefined,
  } = flights[0];

  const flightData = {
    name: flightName,
    date,
    time,
    duration,
    geoFence,
    geoLocation,
    mission: missionId,
    client: res.locals.user._id,
    tenant: res.locals.user.tenantId,
    centerPoints,
  };

  if (assetID !== "none") {
    flightData["assetID"] = assetID;
  }

  if (geoFence) {
    if (geoFence.circle) {
      flightData["geoFence"] = {
        circle: {
          ...geoFence.circle,
        },
        polygon: null,
      };
    } else if (geoFence.polygon) {
      flightData["geoFence"] = {
        polygon: {
          ...geoFence.polygon,
        },
        circle: null,
      };
    }
  }

  if (locationId !== "none") {
    flightData["locationID"] = locationId;
  } else {
    const newLocation = await Location.create({
      geometry: {
        type: "Point",
        coordinates: {
          lng: centerPoints.lng,
          lat: centerPoints.lat,
        },
      },
      properties: {
        name: geoLocation,
      },
      tenantId: res.locals.user.tenantId._id,
    });
    flightData["locationID"] = newLocation._id;
  }

  const newFlight = new Flight(flightData);

  const flight = await newFlight.save();
  const tenantId = res.locals.user.tenantId._id;
  notificationSocket
    .to(tenantId.toString())
    .emit("MISSION_ADDED", { mission, flight });
  res.status(201).json({
    status: true,
    message: "New mission created",
    data: {
      mission,
      flight,
    },
  });
};

//edit deliverable type
export const editMission = async (req: Request, res: AuthResponse) => {
  const { name, description, deliverables, type, isPublic } = req.body;
  const missionType = await MissionType.findById(type);
  const updatedMission = await Mission.findByIdAndUpdate(
    req.body.id,
    {
      name,
      description,
      deliverables,
      missionType: missionType?._id,
      isPublic,
    },
    { new: true },
  )
    .populate<{ user: IUser }>("user", "name")
    .populate<{ missionType: IMissionType }>("missionType");

  if (!updatedMission) {
    return res.json({
      status: false,
      message: "Mission Could not be updated",
    });
  }

  res.json({
    status: true,
    message: "deliverable type editted",
    data: updatedMission,
  });
};

// REVISIT: needs to be changed to use hooks
//delete mission
export const deleteMission = async (req: Request, res: AuthResponse) => {
  //currently skipped with any, but future modification required
  const toBeDeleted = await Mission.findById(req.body._id);
  if (!toBeDeleted)
    return res.status(404).json({
      status: false,
      message: "Project requested top be deleted not found",
    });

  if (
    res.locals.user.userType === "tenant-root" ||
    toBeDeleted.user.toString() === res.locals.user._id.toString()
  ) {
    const deletedMission = await Mission.findByIdAndDelete(req.body._id);
    const deletedLayerData = await Layer.find({ missionId: req.body._id });
    const deletedAlertData = await Alert.find({ missionId: req.body._id });
    const deletedVodData = await VOD.find({ missionID: req.body._id });
    const deletedDocumentsData = await Document.find({
      missionId: req.body._id,
    });
    const deletedFlight = await Flight.deleteMany({
      mission: req.body._id,
    });
    const deletedLayer = await Layer.deleteMany({
      missionId: req.body._id,
    });
    const deletedAlert = await Alert.deleteMany({
      missionId: req.body._id,
    });
    const deletedVod = await VOD.deleteMany({ missionID: req.body._id });
    const deletedDocumetns = await Document.deleteMany({
      missionId: req.body._id,
    });

    const tenant: any = await Tenant.findOne({
      _id: res.locals.user.tenantId,
    });
    if (deletedMission && tenant.actualMissionCount) {
      await Tenant.updateOne(
        { _id: res.locals.user.tenantId },
        { $inc: { actualMissionCount: -1 } },
      );
    }
    for (const layer of deletedLayerData) {
      await layer.delete();
    }
    for (const alert of deletedAlertData) {
      await alert.delete();
    }
    for (const vod of deletedVodData) {
      await vod.delete();
    }
    for (const d of deletedDocumentsData) {
      await d.delete();
    }
    if (deletedMission) {
      const tenantId = res.locals.user.tenantId._id || "";
      notificationSocket.to(tenantId.toString()).emit("MISSION_DELETED", {
        id: deletedMission?._id,
        name: deletedMission?.name,
      });

      res.json({
        status: true,
        message: "Mission deleted",
        data: deletedMission,
      });
    } else {
      res.status(200).json({
        status: false,
        message: "Mission delete failed",
        data: deletedMission,
      });
    }
  }
  //modification might be needed to allow admins to delete
  else {
    return res.status(400).json({
      status: false,
      message: "You can not delete this project",
    });
  }
};

//fetch all flights for a specific mission
export const fetchAllMissionByUserId = async (
  req: Request,
  res: AuthResponse,
) => {
  const missions = await Mission.find({ user: res.locals.user._id });
  res.json({
    status: true,
    message: "Missions fetched sucessfully.",
    data: missions,
  });
};

// fetch all missions of a particular organisation
export const fetchAllMissionsForTenant = async (
  req: Request,
  res: AuthResponse,
) => {
  const { client, filter, missionType, searchFilters, sort } = req.query;
  const isClient = res.locals.user.userType === "tenant-client";

  let escapedString = "";
  if (typeof req.query.name == "string")
    escapedString = escapeRegex(req.query.name);
  const populate: any[] = [
    {
      path: "user",
    },
    {
      path: "missionType",
      select: { name: 1 },
    },
    {
      path: "clientId",
      select: { name: 1 },
    },
  ];

  let sortBy: string;
  if (sort && sort.toString().split(":")[0] !== "flight") {
    sortBy = `${sort.toString().split(":")[1] === "descend" ? "-" : ""}${
      sort.toString().split(":")[0]
    }`;
  } else {
    sortBy = "-createdAt";
  }

  let total: number;

  const page = Number(req.query.page);
  const limit = Number(req.query.limit);
  const startIndex = (page - 1) * limit;

  let missionsList: any[];

  const query = {
    tenantId: res.locals.user.tenantId._id,
    [req.query.name && "name"]: { $regex: escapedString, $options: "i" },
    [missionType && "missionType"]: missionType,
    [filter && filter !== "all" && "status"]: filter,
    [client && "clientId"]: { $exists: true },
    [isClient && "clientId"]: res.locals.user._id,
  };

  if (!searchFilters || searchFilters.toString().trim() === "") {
    // No search filters means we don't need to wait for populating or adding or flights
    // can paginate right away

    const results: IMission[] = await Mission.find(query)
      .sort(sortBy)
      .skip(startIndex)
      .limit(limit)
      .populate(populate)
      .lean();

    // Fetching the flights
    missionsList = await Promise.all(
      results.map(async (mission: IMission) => {
        const missionId = mission._id;
        const flight = await Flight.findOne({ mission: missionId })
          .populate("pilotID")
          .populate("locationID")
          .lean();

        mission["flight"] = flight;
        return mission;
      }),
    );

    // Finding total number of results matching the rest of the query
    total = await Mission.count(query);
  } else {
    // when there are search filters, some of which are based on populated results and flights, we first need to populate and add flights
    // then filter, then finally we can paginate

    const results: IMission[] = await Mission.find(query)
      .sort(sortBy)
      .populate(populate)
      .lean();

    // Fetching the flights
    missionsList = await Promise.all(
      results.map(async (mission: IMission) => {
        const missionId = mission._id;
        const flight = await Flight.findOne({ mission: missionId })
          .populate("pilotID")
          .populate("locationID")
          .lean();

        mission["flight"] = flight;
        return mission;
      }),
    );

    // Filtering
    const filters = searchFilters.toString().split(",");
    missionsList = missionsList.filter((mission: any) => {
      let shouldReturn = true;
      filters.forEach((filter: string) => {
        const filterBy = filter.split(":")[0];
        const value = filter.split(":")[1];
        const re = RegExp(value, "i");
        if (filterBy === "user" && mission.user) {
          shouldReturn = shouldReturn && re.test(String(mission.user.name));
        } else if (filterBy === "createdAt" && mission["createdAt"]) {
          shouldReturn =
            shouldReturn &&
            re.test(moment(mission["createdAt"]).format("YYYY-MM-DD"));
        } else if (filterBy === "flight" && mission.flight) {
          shouldReturn =
            shouldReturn &&
            re.test(moment(mission.flight.date).format("YYYY-MM-DD"));
        } else if (filterBy === "clientId" && mission.clientId) {
          shouldReturn = shouldReturn && re.test(String(mission.clientId.name));
        } else {
          shouldReturn = shouldReturn && re.test(String(mission[filterBy]));
        }
      });
      return shouldReturn;
    });

    // Storing total before pagination
    total = missionsList.length; // length before pagination but after applying all filters

    // Pagination
    if (startIndex < missionsList.length) {
      missionsList = missionsList.slice(
        startIndex,
        Math.min(startIndex + limit, missionsList.length),
      );
    }
  }

  // Sorting filtered and paginated results based on flight field(if asked)
  if (sort.toString().split(":")[0] === "flight") {
    const order = sort.toString().split(":")[1];
    missionsList.sort((a, b) => {
      if (order === "descend") {
        return (
          new Date(b.flight.createdAt).valueOf() -
          new Date(a.flight.createdAt).valueOf()
        );
      }

      return (
        new Date(a.flight.createdAt).valueOf() -
        new Date(b.flight.createdAt).valueOf()
      );
    });
  }

  const allMissionsCount = await Mission.aggregate(
    getNumberOfTypesOfMissions(res.locals.user.tenantId._id),
  );

  const resp = {
    status: true,
    message: "Here are all the missions",
    data: missionsList,
    total,
    missionCount: allMissionsCount,
  };

  res.status(200).json(resp);
};

function flatten(a) {
  return Array.isArray(a) ? [].concat(...a.map(flatten)) : a;
}

// fetch a mission by it's ID
export const fetchMissionById = async (req: Request, res: AuthResponse) => {
  const missionId = req.params.id;
  const isClient = res.locals.user.userType === "tenant-client";
  const mission = await Mission.findOne({
    _id: missionId,
    tenantId: res.locals.user.tenantId._id,
    [isClient && "clientId"]: res.locals.user._id,
  })
    .populate<{ user: IUser }>("user", "name")
    .populate<{ missionType: IMissionType }>("missionType")
    .populate<{ clientId: IUser[] }>("clientId", ["name", "avatar"])
    .populate<{ invites: IInvite }>("invites", "email")
    .lean();

  if (!mission) {
    res.json({
      status: false,
      message: "Mission doesn't exist",
    });
    return;
  }
  mission.clientId = flatten(mission.clientId);

  const flight = await Flight.findOne({
    mission: missionId,
    tenant: res.locals.user.tenantId._id,
  })
    .populate<{ locationID: ILocation }>("locationID")
    .populate<{ pilotID: IUser }>("pilotID");

  const missionDetails = {
    ...mission,
    flight,
  };

  res.json({
    status: true,
    message: "Mission fetched",
    data: missionDetails,
  });
};

//-------------fetch all flights which are assigned to the loggedin pilot or not to anyone--------------
export const fetchAllMissionByPilotOrNull = async (
  req: Request<
    {},
    {},
    {},
    {
      status: string;
      date?: Date;
      startDate?: Date;
      endDate: Date;
      page: number;
      pilotID: Types.ObjectId;
    }
  >,
  res: AuthResponse,
) => {
  const status = req.query.status;
  const qdate = req.query.date;
  const startDate = req.query.startDate;
  const endDate = req.query.endDate;
  const page = req.query.page;
  const userID = req.query.pilotID || res.locals.user._id;
  if (status == "") {
    return res.json({
      status: false,
      message: "Status cant be empty",
    });
  }

  if (status == "All") {
    if (qdate) {
      const selectedFlights = await Flight.find(
        {
          pilotID: userID,
          tenant: res.locals.user.tenantId._id,
          date: qdate,
        },
        null,
        { sort: { createdAt: -1 } },
      )
        .skip(page * 10)
        .limit(10)
        .populate<{ mission: IMission }>("mission")
        .lean();
      return res.json({
        status: true,
        message: "Flight fetched sucessfully.",
        totalPages: Math.ceil(selectedFlights.length / 10),
        data: selectedFlights,
      });
    } else if (startDate) {
      const selectedFlights = await Flight.find(
        {
          pilotID: userID, // REVISIT
          tenant: res.locals.user.tenantId._id,
          date: {
            // REVISIT This will probably not work since date is a string, not a Date
            $gte: startDate,
            $lte: endDate,
          },
        },
        null,
        { sort: { createdAt: -1 } },
      )
        .skip(page * 10)
        .limit(10)
        .populate<{ mission: IMission }>("mission")
        .lean();
      return res.json({
        status: true,
        message: "Flight fetched sucessfully.",
        totalPages: Math.ceil(selectedFlights.length / 10),
        data: selectedFlights,
      });
    } else {
      const selectedFlights = await Flight.find(
        {
          pilotID: userID,
          tenant: res.locals.user.tenantId._id,
        },
        null,
        { sort: { createdAt: -1 } },
      )
        .skip(page * 10)
        .limit(10)
        .populate<{ mission: IMission }>("mission")
        .lean();
      return res.json({
        status: true,
        message: "Flight fetched sucessfully.",
        totalPages: Math.ceil(selectedFlights.length / 10),
        data: selectedFlights,
      });
    }
  } else if (status == "Upcoming") {
    if (qdate) {
      const selectedFlights = await Flight.find(
        {
          pilotID: userID,
          tenant: res.locals.user.tenantId._id,
          date: qdate,
        },
        null,
        { sort: { createdAt: -1 } },
      )
        .skip(page * 10)
        .limit(10)
        .populate<{ mission: IMission }>("mission");
      const filteredFlights = selectedFlights.filter((flight) => {
        if (flight.mission.status == "Upcoming") {
          return flight;
        }
      });
      return res.json({
        status: true,
        message: "Flight fetched sucessfully.",
        totalPages: Math.ceil(filteredFlights.length / 10),
        data: filteredFlights,
      });
    } else if (startDate) {
      const selectedFlights = await Flight.find(
        {
          pilotID: userID,
          tenant: res.locals.user.tenantId._id,
          date: {
            $gte: startDate,
            $lte: endDate,
          },
        },
        null,
        { sort: { createdAt: -1 } },
      )
        .skip(page * 10)
        .limit(10)
        .populate<{ mission: IMission }>("mission")
        .lean();
      return res.json({
        status: true,
        message: "Flight fetched sucessfully.",
        totalPages: Math.ceil(selectedFlights.length / 10),
        data: selectedFlights,
      });
    } else {
      const selectedFlights = await Flight.find(
        {
          pilotID: userID,
          tenant: res.locals.user.tenantId._id,
        },
        null,
        { sort: { createdAt: -1 } },
      )
        .skip(page * 10)
        .limit(10)
        .populate<{ mission: IMission }>("mission");
      const filteredFlights = selectedFlights.filter((flight) => {
        if (flight.mission.status == "Upcoming") {
          return flight;
        }
      });
      return res.json({
        status: true,
        message: "Flight fetched sucessfully.",
        totalPages: Math.ceil(filteredFlights.length / 10),
        data: filteredFlights,
      });
    }
  } else {
    if (qdate) {
      const selectedFlights = await Flight.find(
        {
          pilotID: userID,
          tenant: res.locals.user.tenantId._id,
          date: qdate,
        },
        null,
        { sort: { createdAt: -1 } },
      ).populate<{ mission: IMission }>("mission");
      const filteredFlights = selectedFlights?.filter((flight) => {
        if (flight?.mission.status == status) {
          return flight;
        }
      });
      return res.json({
        status: true,
        message: "Flight fetched sucessfully.",
        totalPages: Math.ceil(filteredFlights.length / 10),
        data: filteredFlights.slice(page * 10, page * 10 + 10),
      });
    } else if (startDate) {
      const selectedFlights = await Flight.find(
        {
          pilotID: userID,
          tenant: res.locals.user.tenantId._id,
          date: {
            $gte: startDate,
            $lte: endDate,
          },
        },
        null,
        { sort: { createdAt: -1 } },
      )

        .populate<{ mission: IMission }>("mission")
        .lean();
      return res.json({
        status: true,
        message: "Flight fetched sucessfully.",
        totalPages: Math.ceil(selectedFlights.length / 10),
        data: selectedFlights.slice(page * 10, page * 10 + 10),
      });
    } else {
      const selectedFlights = await Flight.find(
        {
          pilotID: userID,
          tenant: res.locals.user.tenantId._id,
        },
        null,
        { sort: { createdAt: -1 } },
      ).populate<{ mission: IMission }>("mission");
      const filteredFlights = selectedFlights?.filter((flight) => {
        if (flight?.mission.status == status) {
          return flight;
        }
      });
      return res.json({
        status: true,
        message: "Flight fetched sucessfully.",
        totalPages: Math.ceil(filteredFlights.length / 10),
        data: filteredFlights.slice(page * 10, page * 10 + 10),
      });
    }
  }
};

export const missionStatusUpdate = async (req: Request, res: AuthResponse) => {
  const missionID = new Types.ObjectId(req.body.missionID);
  const status = req.body.status;
  const tenantId = res.locals.user.tenantId._id || "";
  const findDoc = await Mission.findOne({
    _id: missionID,
    tenantId: res.locals.user.tenantId._id,
  }).populate<{ missionType: IMissionType }>("missionType");
  if (findDoc) {
    findDoc.status = status;
    await findDoc.save();
    switch (status) {
      case "Completed":
        notificationSocket
          .to(tenantId.toString())
          .emit("MISSION_COMPLETED", { missionID });
        res.json({
          status: true,
          message: `Mission completed for missionID : ${missionID}`,
        });
        break;
      case "Live":
        notificationSocket
          .to(tenantId.toString())
          .emit("MISSION_LIVE", { missionID });
        res.json({
          status: true,
          message: `Mission going Live for missionID : ${missionID}`,
        });
        break;
      default:
        res.json({
          status: true,
          message: `Mission [${findDoc._id}] status changed to ${status} `,
        });
    }
  } else {
    throw new Error(`MissionID : ${missionID} doesn't exist`);
  }
};

// REVISIT: probably not how it's supposed to work
export const autoComplete = async (req: Request, res: AuthResponse) => {
  const query = String(req.query.query);
  const isClient = res.locals.user.userType === "tenant-client";
  const dbResp = await Mission.find({
    $text: { $search: query },
    tenantId: res.locals.user.tenantId._id,
    [isClient && "clientId"]: res.locals.user._id,
  });
  if (dbResp.length > 0) {
    res.json({
      status: true,
      message: `Result found : ${dbResp.length}`,
      data: dbResp,
    });
  } else {
    res.json({
      status: true,
      message: "No Results found",
      data: dbResp,
    });
  }
};

export const fetchTotalNumberofMissionByLocationID = async (
  req: Request,
  res: AuthResponse,
) => {
  const data = await Flight.count({
    locationID: new Types.ObjectId(String(req.query.id)),
    tenant: res.locals.user.tenantId._id,
  });
  if (data != undefined || data != null) {
    res.json({
      status: true,
      message: "Number of mission data fetched successfully!",
      data: data,
    });
  } else {
    res.status(404).json({
      status: false,
      message: "No Results found",
    });
  }
};

// get mission for a location
export const fetchMissionsByLocationMapref = async (
  req: Request,
  res: AuthResponse,
) => {
  const data = await Flight.find(
    {
      locationID: new Types.ObjectId(String(req.query.id)),
      tenant: res.locals.user.tenantId._id,
    },
    { mission: 1, centerPoints: 1, createdAt: 1 },
  ).populate<{ mission: IMission }>("mission", "name");

  const result: any[] = [];

  for (const flight of data) {
    result.push({
      MissionName: flight.mission.name,
      missionID: flight.mission._id,
      "flight-center-point": flight.centerPoints,
      orderDate: flight.createdAt,
    });
  }
  if (data) {
    res.json({
      status: true,
      message: " mission data fetched successfully!",
      data: result,
    });
  } else {
    res.json({
      status: false,
      message: "No Results found",
    });
  }
};

export const fetchMissionByLocationID = async (
  req: Request,
  res: AuthResponse,
) => {
  const locationID = String(req.query.locationID);
  const missionID = String(req.query.missionID);
  const tenantID = String(res.locals.user.tenantId._id);
  const data = await Flight.aggregate(
    missionByLocationPipe(
      locationID.toString(),
      missionID.toString(),
      tenantID.toString(),
    ),
  );
  if (data.length) {
    res.json({
      status: true,
      message: "Fetched missions by locationID",
      data: data,
    });
  } else {
    res.status(404).json({
      status: false,
      message: "No data exist",
    });
  }
};

export const getDocumentCountForMission = async (
  req: Request,
  res: AuthResponse,
) => {
  const totalAlert = await Alert.countDocuments({
    missionId: new Types.ObjectId(String(req.query.missionId)),
    tenantId: res.locals.user.tenantId._id,
  });
  const totalVOD = await VOD.countDocuments({
    missionID: new Types.ObjectId(String(req.query.missionId)),
    tenantId: res.locals.user.tenantId._id,
  });
  const totalImages = await Document.countDocuments({
    missionId: new Types.ObjectId(String(req.query.missionId)),
    tenantId: res.locals.user.tenantId._id,
    folderName: "photos",
  });
  const totalDocs = await Document.countDocuments({
    missionId: new Types.ObjectId(String(req.query.missionId)),
    tenantId: res.locals.user.tenantId._id,
    folderName: { $ne: "photos" },
  });
  res.status(200).json({
    status: true,
    message: "Fetched Mission Doc count",
    data: {
      alerts: totalAlert,
      vods: totalVOD,
      images: totalImages,
      docs: totalDocs,
    },
  });
};

export const insertMissionTypeById = async (
  req: Request,
  res: AuthResponse,
) => {
  const result = await Mission.findById(req.body.id);
  if (result) {
    result.missionType = req.body.missionType;
    await result.save();
    return res.status(200).json({
      status: true,
      message: "Successfully data updated!",
    });
  } else
    return res.status(404).json({
      status: false,
      message: "No data exist",
    });
};

export const insertMissionTypeBytenantId = async (
  req: Request,
  res: AuthResponse,
) => {
  const result = await Mission.updateMany(
    {
      tenantId: res.locals.user.tenantId._id,
    },
    { missionType: req.body.missionType },
  );
  if (result) {
    return res.status(200).json({
      status: true,
      message: "Successfully data updated!",
    });
  } else
    return res.status(404).json({
      status: false,
      message: "No data exist",
    });
};

export const getMissionCsvForTenantOrUser = async (
  req: Request,
  res: AuthResponse,
) => {
  const result = await Mission.find(
    {
      user: req.body.userId,
      tenantId: res.locals.user.tenantId._id,
      status: req.body.status,
    },
    { name: 1, status: 1, deliverables: 1, missionType: 1 },
  )
    .populate<{ missionType: IMissionType }>({
      path: "missionType",
      select: "name",
    })
    .lean();
  if (result.length) {
    const filename =
      "missions-" +
      String(req.body.userId || res.locals.user.tenantId._id) +
      ".csv";
    const { filepath } = await saveCSV(
      filename,
      result,
      "",
      res.locals.user.tenantId._id,
      res.locals.user._id,
    );
    return res.status(200).json({
      status: true,
      message: "Successfully csv file created!",
      pathh: filepath,
    });
  } else
    return res.status(404).json({
      status: false,
      message: "No data exist",
    });
};

// REVISIT: this should be removed
// convert clientId from ObjectId to array of Object Id
export const convertClientIdToArray = async (
  req: Request,
  res: AuthResponse,
) => {
  const result = await Mission.updateMany(
    {
      $nor: [
        {
          clientId: {
            $type: "array",
          },
        },
        {
          clientId: {
            $eq: null,
          },
        },
      ],
    },
    [
      {
        $set: {
          clientId: ["$clientId"],
        },
      },
    ],
  );
  await Mission.updateMany(
    {
      clientId: { $exists: true, $type: "array" },
    },
    {
      $pull: {
        clientId: null,
      },
    },
  );
  return res.json({
    status: true,
    message: "converted client id to array",
    data: {
      count: result.modifiedCount,
    },
  });
};

export const getMissionLayerFiles = async (
  req: Request<{ id: Types.ObjectId }>,
  res: AuthResponse,
) => {
  const data = await Layer.aggregate([
    {
      $match: {
        missionId: new Types.ObjectId(req.params.id),
        tenantId: res.locals.user.tenantId._id,
        type: "Vector",
      },
    },
    {
      $lookup: {
        from: "layerfiles",
        localField: "_id",
        foreignField: "layerId",
        as: "layerfiles",
      },
    },
    {
      $project: {
        name: 1,
        color: 1,
        layerfiles: {
          name: 1,
          filePath: 1,
        },
      },
    },
  ]);
  return res.json({
    status: true,
    message: "Successfully get mission layer files",
    data: data,
  });
};

const getAlertLocationGeojson = async (
  tenantId: Types.ObjectId,
  startDate: Date,
  endDate: Date,
  missionID: Types.ObjectId,
) => {
  const alerts = await Alert.find({
    tenantId,
    missionId: missionID,
    createdAt: { $gte: startDate, $lte: endDate },
    "location.lat": { $exists: true },
    "location.long": { $exists: true },
  });
  const geojson = {
    type: "FeatureCollection",
    name: "Images",
    crs: {
      type: "name",
      properties: {
        name: "urn:ogc:def:crs:OGC:1.3:CRS84",
      },
    },
    features: alerts.map((alert, index) => ({
      type: "Feature",
      properties: {
        _id: alert._id,
        Latitude: alert.location.lat,
        Longitude: alert.location.long,
        Name: alert.locationName,
        DoC: alert.createdAt.toLocaleDateString(),
        Remarks: alert.note,
        color: "#d0021b",
        icon: "MarkerIcon",
        LocationID: alert.locationId,
        Image: alert.image,
        isFlagged: alert.isFlagged,
      },
      geometry: {
        type: "Point",
        coordinates: [alert.location.long, alert.location.lat],
      },
    })),
  };
  return geojson;
};

export const GetAlertLocationGeojson = async (
  req: Request<
    { missionID: Types.ObjectId },
    unknown,
    unknown,
    { startDate: Date; endDate: Date }
  >,
  res: AuthResponse,
) => {
  const startDate = req.query.startDate;
  const endDate = req.query.endDate;
  const geojson = await getAlertLocationGeojson(
    res.locals.user.tenantId._id,
    startDate,
    endDate,
    new Types.ObjectId(req.params.missionID),
  );
  res.json(geojson);
};

const getVideoLocationGeojson = async (
  tenantId: Types.ObjectId,
  startDate: Date,
  endDate: Date,
  missionID: Types.ObjectId,
) => {
  const videos = await VOD.aggregate([
    {
      $match: {
        tenantId,
        missionID,
        createdAt: { $gte: startDate, $lte: endDate },
        locationID: { $exists: true, $ne: "undefined" },
      },
    },
    {
      $group: {
        _id: "$locationID",
        videos: {
          $push: {
            _id: "$_id",
            flightID: "$flightID",
            missionID: "$missionID",
            videoPath: "$videoPath",
            thumbnail: "$thumbnail",
            tenantId: "$tenantId",
            videoName: "$videoName",
            fileSize: "$fileSize",
            isSRT: "$isSRT",
            isFlagged: "$isFlagged",
            createdAt: "$createdAt",
            updatedAt: "$updatedAt",
          },
        },
      },
    },
    {
      $lookup: {
        from: "locations",
        localField: "_id",
        foreignField: "_id",
        as: "location",
      },
    },
    {
      $unwind: "$location",
    },
    {
      $project: {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [
            "$location.geometry.coordinates.lng",
            "$location.geometry.coordinates.lat",
          ],
        },
        properties: {
          videos: "$videos",
          name: "$location.properties.name",
          longitude: "$location.geometry.coordinates.lng",
          latitude: "$location.geometry.coordinates.lat",
          locationID: "$_id",
        },
      },
    },
  ]);
  const geojson = {
    type: "FeatureCollection",
    name: "Videos",
    crs: {
      type: "name",
      properties: {
        name: "urn:ogc:def:crs:OGC:1.3:CRS84",
      },
    },
    features: videos,
  };
  return geojson;
};

export const GetVideoLocationGeojson = async (
  req: Request<
    { missionID: Types.ObjectId },
    unknown,
    unknown,
    { startDate: Date; endDate: Date }
  >,
  res: AuthResponse,
) => {
  const startDate = req.query.startDate;
  const endDate = req.query.endDate;
  const geojson = await getVideoLocationGeojson(
    res.locals.user.tenantId._id,
    startDate,
    endDate,
    new Types.ObjectId(req.params.missionID),
  );
  res.json(geojson);
};
