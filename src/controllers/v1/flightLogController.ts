import { Request } from "express";
import { Types } from "mongoose";
import flightLog from "../../models/flightLog";
import { AuthResponse } from "../../utils/interfaceUtils";
import { renameFile } from "../../utils/moveFileUtils";

export const createFlightLog = async (req: Request, res: AuthResponse) => {
  {
    if (req.file) {
      //adding extension to file
      await renameFile(
        req.file.path,
        req.file.path + "." + req.file.mimetype.split("/")[1]
      );

      const filePath = `/flight_logs/${req.file.filename}.${
        req.file.mimetype.split("/")[1]
      }`;
      const {
        date,
        time,
        missionID,
        flightID,
        assetID,
        locationID,
        duration,
        location,
        geofence,
        flightArea,
        pilotName,
        jobType,
        deliverables,
      } = req.body;
      const newLog = new flightLog({
        date,
        time,
        missionID,
        flightID,
        assetID,
        locationID,
        duration,
        location,
        geofence,
        flightArea,
        filePath,
        pilotName,
        jobType,
        deliverables,
        tenantId: res.locals.user.tenantId._id,
      });
      const savedDoc = await newLog.save();
      res.status(201).json({
        status: true,
        message: "Sucessfully saved the document",
        data: savedDoc,
      });
    } else {
      throw new Error("File couldn't be uploaded");
    }
  }
};

export const getLog = async (req: Request, res: AuthResponse) => {
  {
    let data;
    if (req.query._id) {
      data = await flightLog.find({
        _id: req.query._id,
        tenantId: res.locals.user.tenantId._id,
      });
    } else {
      data = await flightLog.find({ tenantId: res.locals.user.tenantId._id });
    }
    if (data.length) {
      res.json({
        status: true,
        message: "fetched flight logs",
        data: data,
      });
    } else {
      res.status(404).json({
        status: true,
        message: "Empty flight log collection",
      });
    }
  }
};

export const fetchLatestFlightlogDataByMissionId = async (
  req: Request,
  res: AuthResponse
) => {
  {
    if (req.query.missionID != undefined) {
      const missionId = new Types.ObjectId(String(req.query.missionID));
      const data = await flightLog
        .findOne({
          missionID: missionId,
          tenantId: res.locals.user.tenantId._id,
        })
        .sort({
          date: "desc",
          time: "desc",
        })
        .limit(1);
      if (data) {
        res.json({
          status: true,
          message: "fetched flight logs",
          data: data,
        });
        return;
      } else {
        res.status(404).json({
          status: false,
          message: "Empty flight log collection",
        });
        return;
      }
    } else {
      const locationId = new Types.ObjectId(String(req.query.locationID));
      if (locationId != undefined) {
        const data = await flightLog
          .findOne({
            locationID: locationId,
            tenantId: res.locals.user.tenantId._id,
          })
          .sort({
            date: "desc",
            time: "desc",
          })
          .limit(1);
        if (data) {
          res.json({
            status: true,
            message: "fetched flight logs",
            data: data,
          });
        } else {
          res.status(404).json({
            status: false,
            message: "Empty flight log collection",
          });
        }
      }
    }
  }
};

export const fetchLatestFlightlogByLocationId = async (
  req: Request,
  res: AuthResponse
) => {
  {
    const locationId = new Types.ObjectId(String(req.query.id));
    const data = await flightLog
      .findOne({
        locationID: locationId,
        tenantId: res.locals.user.tenantId._id,
      })
      .sort({
        date: "desc",
        time: "desc",
      })
      .limit(1);
    if (data) {
      res.json({
        status: true,
        message: "fetched flight logs",
        data: data,
      });
    } else {
      res.status(404).json({
        status: false,
        message: "Empty flight log collection",
      });
    }
  }
};
