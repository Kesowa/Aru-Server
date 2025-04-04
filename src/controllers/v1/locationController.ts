import { Request } from "express";
import { Types } from "mongoose";

import Location from "../../models/location";
import Tenant from "../../models/tenant";
import { GeometryObj } from "../../schemas/location";
import { notificationSocket } from "../../socket";
import { AuthResponse } from "../../utils/interfaceUtils";
export const createLocation = async (
  req: Request<{}, {}, GeometryObj & { properties: { name: string } }>,
  res: AuthResponse,
) => {
  const newLocation = await Location.create({
    geometry: {
      type: req.body.type,
      coordinates: req.body.coordinates,
    },
    properties: req.body.properties,
    tenantId: res.locals.user.tenantId._id,
  });
  const tenant = await Tenant.findOne({ _id: res.locals.user.tenantId });
  if (newLocation && tenant.actualLocationCount >= 0) {
    await Tenant.updateOne(
      { _id: res.locals.user.tenantId },
      { $inc: { actualLocationCount: 1 } },
    );
  }
  if (newLocation) {
    const message = `New Location saved with ObjectId: ${newLocation._id}`;
    req.log.info(message);
    notificationSocket
      .to(res.locals.user.tenantId._id.toString())
      .emit("CREATE_LOCATION", newLocation);
    res.status(201).json({
      status: true,
      message: message,
      data: newLocation,
    });
  } else {
    const message = "An error occured while saving Location";
    res.status(500).json({
      status: false,
      message: message,
    });
  }
};

export const getLocation = async (req: Request, res: AuthResponse) => {
  try {
    const locationInfo = await Location.aggregate([
      { $match: { tenantId: res.locals.user.tenantId._id } },
      {
        $lookup: {
          from: "missions",
          localField: "_id",
          foreignField: "locationID",
          as: "missionCount",
        },
      },
      {
        $lookup: {
          from: "alerts",
          localField: "_id",
          foreignField: "locationId",
          as: "alertCount",
        },
      },
      {
        $project: {
          _id: "$_id",
          geometry: "$geometry",
          properties: "$properties",
          tenantId: "$tenantId",
          missionCount: { $size: "$missionCount" },
          alertCount: { $size: "$alertCount" },
        },
      },
    ]);

    const message = "Sucessfully fetched all locations";
    res.json({
      status: true,
      message: message,
      data: locationInfo,
    });
  } catch (error: unknown) {
    req.log.error(error);
    const message = "An error occured";
    res.status(500).json({
      status: false,
      message: message,
    });
  }
};

export const getLocationByID = async (req: Request, res: AuthResponse) => {
  const doc = await Location.findOne({
    _id: req.query.id,
    tenantId: res.locals.user.tenantId._id,
  });
  if (doc) {
    res.status(200).json({
      status: true,
      message: `Successfully Fetched ${req.query.id}`,
      data: doc,
    });
  } else {
    res.status(404).json({
      status: false,
      message: `Data not found`,
    });
  }
};

export const getwithinLocationByID = async (
  req: Request,
  res: AuthResponse,
) => {
  try {
    const selectedDoc = await Location.findOne({
      _id: req.query.id,
      tenantId: res.locals.user.tenantId._id,
    });
    if (selectedDoc) {
      const docs = await Location.find({
        geometry: {
          $geoWithin: {
            $geometry: {
              ...selectedDoc.geometry,
            },
          },
        },
        tenantId: res.locals.user.tenantId._id,
      });
      if (docs) {
        const message = `Sucessfully fetched places for ObjectId: ${req.query.id}`;
        res.json({
          status: true,
          message: message,
          data: docs,
        });
      } else {
        const message = `location with ObjectId : ${req.query.id} doesn't exist`;
        req.log.warn(message);
        res.status(404).json({
          status: false,
          message: message,
        });
      }
    } else {
      const message = `location with ObjectId : ${req.query.id} doesn't exist`;
      req.log.warn(message);
      res.status(404).json({
        status: false,
        message: message,
      });
    }
  } catch (error: any) {
    const message = "Internal Server error";
    req.log.error(error);
    res.status(500).json({
      status: false,
      message: message,
    });
  }
};

export const updateLocation = async (req: Request, res: AuthResponse) => {
  const id = new Types.ObjectId(String(req.body.id));
  const findDoc = await Location.findOneAndUpdate(
    {
      _id: id,
      tenantId: res.locals.user.tenantId._id,
    },
    {
      $set: {
        geometry: req.body.geometry,
        properties: req.body.properties,
      },
    },
    {
      new: true,
    },
  );
  if (findDoc) {
    const message = `Location Id : ${findDoc._id} updated`;

    req.log.info(message);
    notificationSocket
      .to(res.locals.user.tenantId._id.toString())
      .emit("UPDATE_LOCATION", findDoc);
    res.json({
      status: true,
      message: message,
      data: findDoc,
    });
  } else {
    const message = "Location not found";
    req.log.info(message);
    res.status(404).json({
      status: true,
      message: message,
    });
  }
};

export const deleteLocation = async (req: Request, res: AuthResponse) => {
  try {
    const id = new Types.ObjectId(String(req.query.id));
    const deletedDoc = await Location.findOneAndDelete({
      _id: id,
      tenantId: res.locals.user.tenantId._id,
    });
    const tenant = await Tenant.findOne({ _id: res.locals.user.tenantId });
    if (deletedDoc && tenant.actualLocationCount) {
      await Tenant.updateOne(
        { _id: res.locals.user.tenantId },
        { $inc: { actualLocationCount: -1 } },
      );
    }
    if (deletedDoc) {
      const message = `Sucessfully deleted doc with id: ${id}`;
      notificationSocket
        .to(res.locals.user.tenantId._id.toString())
        .emit("DELETE_LOCATION", deletedDoc);
      req.log.info(message);
      res.json({
        status: true,
        message: message,
        data: deletedDoc,
      });
    } else {
      const message = `Location tenantId not match with user's tenantId`;
      req.log.info(message);
      res.status(404).json({
        status: false,
        message: message,
      });
    }
  } catch (error: unknown) {
    req.log.error(error);
    const message = `Internal Server error`;
    res.status(500).json({
      status: false,
      message: message,
    });
  }
};

// get location for lat,long
export const getLocationByLatLong = async (req: Request, res: AuthResponse) => {
  const lat = Number(req.query.lat);
  const long = Number(req.query.long);
  const locations = await Location.find({
    tenantId: new Types.ObjectId(res.locals.user.tenantId._id),
  });
  req.log.info("LOCATIONS: ", locations);
  const location = locations.find(l => l.geometry.coordinates[0] === long && l.geometry.coordinates[1] === lat );
  if (location) {
    res.json({
      status: true,
      message: "fetch successfully location data",
      data: location,
    });
    return;
  }

  res.status(404).json({
    status: false,
    message: "Cordinate does not exist in locations",
  });
};
