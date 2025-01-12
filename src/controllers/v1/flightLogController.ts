import { Request } from "express";
import { Types } from "mongoose";
import flightLog from "../../models/flightLog";
import { AuthResponse } from "../../utils/interfaceUtils";
import UploadTask from "../../models/uploadTask";
import { permPath } from "../../utils/dataUtils";
import { Directory } from "../../constants";

export const createFlightLog = async (req: Request, res: AuthResponse) => {
  {
    const fileDoc = await UploadTask.findOne({
      _id: req.body.file,
      tenant: res.locals.user.tenantId._id,
      createdBy: res.locals.user._id,
      // status: "started",
    });
    if (fileDoc) {
      const filePath = await permPath(
        Directory.FLIGHT_LOGS,
        fileDoc.metadata.objectkey
      );

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
        fileSize: fileDoc.metadata.filesize,
        tenantId: res.locals.user.tenantId._id,
      });
      const savedDoc = await newLog.create();
      await fileDoc.delete();
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
        .find({
          missionID: missionId,
          tenantId: res.locals.user.tenantId._id,
        })
        .sort({
          date: "desc",
          time: "desc",
        })
        .limit(1);
      if (data.length > 0) {
        res.json({
          status: true,
          message: "fetched flight logs",
          data: data[0],
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
          .find({
            locationID: locationId,
            tenantId: res.locals.user.tenantId._id,
          })
          .sort({
            date: "desc",
            time: "desc",
          })
          .limit(1);
        if (data.length > 0) {
          res.json({
            status: true,
            message: "fetched flight logs",
            data: data[0],
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
      .find({
        locationID: locationId,
        tenantId: res.locals.user.tenantId._id,
      })
      .sort({
        date: "desc",
        time: "desc",
      })
      .limit(1);
    if (data.length > 0) {
      res.json({
        status: true,
        message: "fetched flight logs",
        data: data[0],
      });
    } else {
      res.status(404).json({
        status: false,
        message: "Empty flight log collection",
      });
    }
  }
};
