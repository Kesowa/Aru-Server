import { Request } from "express";
import Flight from "../../models/flight";
import Mission from "../../models/mission";
import User from "../../models/user";
import { AuthResponse } from "../../utils/interfaceUtils";
import { Types } from "mongoose";
import { logger } from "../../utils/logUtils";
import { notificationSocket } from "../../socket";
import { IUser } from "../../schemas/user";
import { ILocation } from "../../schemas/location";

//create flight controller
export const createFlight = async (req: Request, res: AuthResponse) => {
  {
    const {
      date,
      name,
      mission,
      time,
      duration,
      geoFence = undefined,
    } = req.body;

    const newFlight = new Flight({
      date,
      name,
      mission,
      time,
      duration,
      geoFence,
      client: res.locals.user._id,
      tenant: res.locals.user.tenantId,
    });
    const data = await newFlight.save();
    const message = `A New flight[${data._id.toString()}] created by ${
      res.locals.user.name
    }[${res.locals.user._id.toString()}]`;
    res.locals.log = logger(req, res, message, 200);
    res.status(201).json({
      status: true,
      message: "New flight created",
      data,
    });
  }
};

//edit deliverable type
export const editFlight = async (req: Request, res: AuthResponse) => {
  {
    const {
      name,
      date,
      duration,
      time,
      locationId,
      geofence = undefined,
      geoLocation = undefined,
      centerPoints,
    } = req.body;

    const data: any = {
      name,
      date,
      duration,
      time,
      centerPoints,
    };
    if (geofence?.polygon && geofence.polygon.length > 0) {
      data["geoFence"] = {
        polygon: {
          ...geofence.polygon,
        },
      };
    } else if (geofence?.circle) {
      data["geoFence"] = {
        circle: {
          ...geofence.circle,
        },
      };
    }

    if (locationId !== "none") {
      data["locationID"] = locationId;
    }

    if (geoLocation) {
      data["geoLocation"] = geoLocation;
    }
    const updatedFlight = await Flight.findOneAndUpdate(
      { _id: req.body._id, tenant: res.locals.user.tenantId._id },
      data,
      {
        new: true,
      }
    ).populate<{ locationID: ILocation }>("locationID");

    res.locals.log = {
      status: 200,
      userID: String(res.locals.user._id),
      route: req.baseUrl,
      message: `flight[${data._id}] edited by ${res.locals.user.name}[${res.locals.user._id}]`,
      timestamp: new Date(),
    };
    if (updatedFlight) {
      res.json({
        status: true,
        message: "Flight Edited Successfully",
        data: updatedFlight,
      });
    } else {
      res.status(404).json({
        status: false,
        message: "flight tenantID and user tenantID mismatched.",
      });
    }
  }
};

//delete flight
export const deleteFlight = async (req: Request, res: AuthResponse) => {
  {
    //currently skipped with any, but future modification required
    const toBeDeleted = await Flight.findOneAndDelete({
      _id: req.body._id,
      tenant: res.locals.user.tenantId._id,
      client: res.locals.user._id,
    });

    if (!toBeDeleted)
      return res.status(404).json({
        status: false,
        message: "Project requested top be deleted not found",
      });

    //modification might be needed to allow admins to delete
    res.locals.log = {
      status: 200,
      userID: String(res.locals.user._id),
      route: req.baseUrl,
      message: `flight[${toBeDeleted._id.toString()}] deleted by ${
        res.locals.user.name
      }[${res.locals.user._id.toString()}]`,
      timestamp: new Date(),
    };

    return res.json({
      status: true,
      message: "Flight deleted",
      data: toBeDeleted,
    });
  }
};

//fetch all flights for a specific mission
export const fetchAllFlightByMissionId = async (
  req: Request,
  res: AuthResponse
) => {
  {
    const flights = await Flight.find({
      mission: req.body.missionID,
      tenant: res.locals.user.tenantId._id,
    })
      .populate<{ client: IUser }>("client", {
        _id: 0,
        name: 1,
        phoneNo: 1,
        avatar: 1,
      })
      .populate<{ pilotID: IUser }>("pilotID")
      .populate<{ locationID: ILocation }>("locationID");
    if (flights.length) {
      res.json({
        status: true,
        message: "Flight fetched sucessfully.",
        data: flights,
      });
    } else {
      res.json({
        status: false,
        message: "Wrong input",
      });
    }
  }
};

/*
  * assignPilotSelf can't assign a flight to itself if it already have a pilot assigned

*/

export const assignPilotSelf = async (req: Request, res: AuthResponse) => {
  {
    const flightID = req.body.flightID;
    const pilotID = String(res.locals.user._id);
    const findDoc = await Flight.findOneAndUpdate(
      { _id: flightID, tenant: res.locals.user.tenantId._id, pilotID: null },
      { pilotID: pilotID },
      { new: true }
    );
    if (findDoc == null) {
      return res.status(404).json({
        status: false,
        message: "Flight doesn't exist or Flight Already have a pilot assigned",
      });
    }
    const mission = findDoc.mission;
    const name = res.locals.user.name;
    const avatar = res.locals.user.avatar;
    notificationSocket
      .to(res.locals.user.tenantId._id.toString())
      .emit("PILOT_ASSIGNED", { mission, name, avatar });
    res.locals.log = {
      status: 200,
      userID: String(res.locals.user._id),
      route: req.baseUrl,
      message: `pilot[${pilotID}] : ${res.locals.user.name} assigned the flight[${flightID}] to self`,
      timestamp: new Date(),
    };
    return res.json({
      status: true,
      message: "Successfully assigned pilot",
      data: findDoc,
    });
  }
};

export const assignPilot = async (req: Request, res: AuthResponse) => {
  {
    const flightID = req.body.flightID;
    const pilotID = req.body.pilotID;
    const findDoc = await Flight.findOneAndUpdate(
      {
        _id: flightID,
        tenant: res.locals.user.tenantId._id,
      },
      {
        pilotID: pilotID,
      },
      {
        new: true,
      }
    ).populate<{ pilotID: IUser }>("pilotID");
    if (findDoc) {
      const mission = findDoc.mission;
      const pilot = findDoc.pilotID;
      const name = pilot.name;
      const avatar = pilot.avatar;
      notificationSocket
        .to(res.locals.user.tenantId._id.toString())
        .emit("PILOT_ASSIGNED", { mission, name, avatar });
      res.locals.log = {
        status: 200,
        userID: String(res.locals.user._id),
        route: req.baseUrl,
        message: `flight[${flightID}] assigned by ${res.locals.user.name}[${res.locals.user._id}] to pilot[${pilotID}]`,
        timestamp: new Date(),
      };

      res.json({
        status: true,
        message: "Successfully assigned pilot",
        data: findDoc,
      });
    } else {
      res.status(404).json({
        status: false,
        message: "Flight doesnt exist",
      });
    }
  }
};

//development purpose, list of all flights
export const fetchAllFlights = async (req: Request, res: AuthResponse) => {
  {
    const flights = await Flight.find({ tenant: res.locals.user.tenantId._id });
    if (flights.length) {
      res.json({
        status: true,
        message: "Here are all the flights",
        data: flights,
      });
    } else {
      res.json({
        status: false,
        message: "Wrong input",
      });
    }
  }
};

// flight data get by location id
export const fetchAllFlightdataByLocationId = async (
  req: Request,
  res: AuthResponse
) => {
  {
    const flightdata = await Flight.find({
      locationID: new Types.ObjectId(String(req.query.id)),
      tenant: res.locals.user.tenantId._id,
    });
    if (flightdata.length) {
      res.json({
        status: true,
        message: "Flight data fetch successfully",
        data: flightdata,
      });
    } else {
      res.status(404).json({
        status: false,
        message: "WRONG Input",
      });
    }
  }
};

export const fetchFlightsWithoutMission = async (
  req: Request,
  res: AuthResponse
) => {
  {
    const flights = await Flight.aggregate([
      {
        $match: {
          tenant: res.locals.user.tenantId._id,
        },
      },
      {
        $lookup: {
          as: "mission",
          from: "missions",
          localField: "mission",
          foreignField: "_id",
        },
      },
      {
        $match: {
          mission: [],
        },
      },
      {
        $project: {
          mission: null,
        },
      },
    ]);
    res.status(200).json({
      status: true,
      message: "Data fetched successfully",
      data: flights,
    });
  }
};
