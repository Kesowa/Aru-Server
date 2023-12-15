import { Request } from "express";
import Alert from "../../models/alert";
import { AuthResponse } from "../../utils/interfaceUtils";
import { notificationSocket } from "../../socket";
import Tenant from "../../models/tenant";
import { Types } from "mongoose";
import { subWeeks, subDays, subMonths, subYears } from "date-fns";
import { deleteDirFileUsingName } from "../../utils/fileDeleteUtils";

import { IMission } from "../../schemas/mission";
import { IUser } from "../../schemas/user";
import { IFlight } from "../../schemas/flight";
import { ARU_INSTANCE, Directory, DirPath, Instance } from "../../constants";
import { getFileSize } from "../../utils/fileUtils";
import path from "path";
import { WiproInterface } from "../../utils/wipro";
import { readCoords, saveThumbnails } from "../../utils/imageUtils";
import * as pathUtils from "../../utils/pathUtils";


// Create Alert Controlller
type CreateAlert = {
  missionId: Types.ObjectId;
  flightId: Types.ObjectId;
  locationName: string;
  locationId?: Types.ObjectId;
  location?: { lat: number; long: number };
  note?: string;
  onSite?: boolean;
  image: string;
  pcount: number;
  type: string;
};
export const createAlert = async (
  req: Request<{}, {}, CreateAlert>,
  res: AuthResponse
) => {
  {
    const { locationName, missionId, locationId, flightId, pcount, type } =
      req.body;
    if (req.body.location) {
      req.body.location = {
        lat: req.body.location.lat ? req.body.location.lat : 0,
        long: req.body.location.long ? req.body.location.long : 0,
      };
    }
    const docPath: string = DirPath(Directory.ROOT, req.body.image);
    const size1: number = await getFileSize(docPath);
    const newAlert = new Alert({
      locationName,
      location: req.body.location
        ? req.body.location
        : {
          lat: 0,
          long: 0,
        },
      missionId,
      locationId,
      createdBy: res.locals.user._id,
      flightId,
      tenantId: res.locals.user.tenantId,
      pcount,
      note: req.body.note ? req.body.note : "",
      onSite: req.body.onSite,
      type,
      fileSize: size1,
      image: req.body.image ? req.body.image : undefined,
    });

    const data = await newAlert.save();
    if (ARU_INSTANCE == Instance.NKDA) {
      await WiproInterface.SendAlert(data, req.ip, req.log);
    }
    notificationSocket
      .to(String(res.locals.user.tenantId._id))
      .emit("ALERT_CREATED", {
        ...data,
        createdBy: res.locals.user,
      });
    const tenant = await Tenant.findOne({ _id: res.locals.user.tenantId });
    if (data && tenant.actualAlertCount >= 0) {
      await Tenant.updateOne(
        { _id: res.locals.user.tenantId },
        { $inc: { actualAlertCount: 1 } }
      );
    }
    res.status(201).json({
      status: true,
      message: "New alert created",
      data,
    });
  }
};

// get All alert Data by flightId
export const fetchAllAlertByFlightorLocationId = async (
  req: Request,
  res: AuthResponse
) => {
  {
    const { flightID, locationID } = req.query;
    const alert = await Alert.find({
      [flightID && "flightId"]: new Types.ObjectId(String(flightID)),
      [locationID && "locationId"]: new Types.ObjectId(String(locationID)),
      $or: [
        { tenantId: res.locals.user.tenantId._id },
        { createdBy: res.locals.user._id },
      ],
    });

    if (alert.length) {
      res.status(200).json({
        status: true,
        message: "Alerts fetched successfully",
        data: alert,
      });
    } else {
      res.status(404).json({
        status: false,
        message: "Wrong Input",
      });
    }
  }
};

// get All Alert Data By Alert Id
export const fetchAllAlertByAlertId = async (
  req: Request,
  res: AuthResponse
) => {
  {
    const alert = await Alert.find({
      _id: req.query.id,
      $or: [
        { tenantId: res.locals.user.tenantId._id },
        { createdBy: res.locals.user._id },
      ],
    }).populate<{ createdBy: IUser }>({ path: "createdBy" });
    if (alert) {
      res.status(200).json({
        status: true,
        message: "Alert fetched successfully",
        data: alert,
      });
    } else {
      res.status(404).json({
        status: false,
        message: "Alert Not Found",
      });
    }
  }
};

// get All Alert Data By Location Id
export const fetchAllAlertByLocationId = async (
  req: Request,
  res: AuthResponse
) => {
  {
    const alert = await Alert.find({
      locationId: req.query.id,
      $or: [
        { tenantId: res.locals.user.tenantId._id },
        { createdBy: res.locals.user._id },
      ],
    });
    let data = [];

    data = alert.map((a) => ({
      id: a._id,
      locationName: a.locationName,
      location: a.location,
      alertImage: a.image,
    }));
    if (alert) {
      res.status(200).json({
        status: true,
        message: "Alert fetched successfully",
        data: data,
      });
    } else {
      res.status(404).json({
        status: false,
        message: "Wrong input",
      });
    }
  }
};

// get Number of Alertsgit By LocationId
export const fetchNumberofAlertsByLocationId = async (
  req: Request,
  res: AuthResponse
) => {
  {
    const alert = await Alert.find(
      {
        locationId: new Types.ObjectId(String(req.query.id)),
        $or: [
          { tenantId: res.locals.user.tenantId._id },
          { createdBy: res.locals.user._id },
        ],
      },
      {
        _id: 0,
        locationName: 1,
      }
    );
    if (alert) {
      res.json({
        status: true,
        message: "Alert fetched successfully",
        data: alert.length,
        location: alert,
      });
    } else {
      res.json({
        status: false,
        message: "Wrong input ",
      });
    }
  }
};

// fetch alerts use pagination by missionID
export const fetchAlertsUsePaginationByMissionID = async (
  req: Request,
  res: AuthResponse
) => {
  {
    const { page, limit, sortBy, id, isFlagged, alertType } = req.query;

    const query = {
      [id && "missionId"]: new Types.ObjectId(String(id)),
      [isFlagged && "isFlagged"]: isFlagged,
      $or: [
        { tenantId: res.locals.user.tenantId._id },
        { createdBy: res.locals.user._id },
      ],
    };

    const total = await Alert.countDocuments(query);

    const startIndex = (Number(page) - 1) * Number(limit);

    let orderBy: string, order: number;
    if (sortBy) {
      const parts = String(sortBy).split(":");
      orderBy = parts[0];
      order = parts[1] === "desc" ? -1 : 1;
    }

    const result = await Alert.find(
      {
        ...query,
        [alertType && "type"]: String(alertType),
      },
      null,
      {
        sort: { [orderBy]: order },
      }
    )
      .populate<{ missionId: IMission }>({
        path: "missionId",
        select: "name",
        options: { sort: { [orderBy]: order } },
      })
      .populate<{ flightId: IFlight }>({
        path: "flightId",
        select: "name",
        options: { sort: { [orderBy]: order } },
      })
      .populate<{ createdBy: IUser }>({
        path: "createdBy",
        options: { sort: { [orderBy]: order } },
      })
      .limit(Number(limit))
      .skip(startIndex);

    if (result) {
      res.status(200).json({
        status: true,
        message: "Alert fetched successfully",
        data: result,
        total,
      });
    } else {
      res.status(404).json({
        status: false,
        message: "No data found",
        data: [],
      });
    }
  }
};

export const fetchAlertsUsePaginationByLocationId = async (
  req: Request,
  res: AuthResponse
) => {
  {
    const { id, sortBy, page, limit } = req.query;
    const startIndex = (Number(page) - 1) * Number(limit);
    let orderBy: string, order: number;
    if (sortBy) {
      const parts = String(sortBy).split(":");
      orderBy = parts[0];
      order = parts[1] === "desc" ? -1 : 1;
    }
    const result = await Alert.find(
      {
        locationId: new Types.ObjectId(String(id)),
        $or: [
          { tenantId: res.locals.user.tenantId._id },
          { createdBy: res.locals.user._id },
        ],
      },
      null,
      { sort: { [orderBy]: order } }
    )
      .populate<{ missionId: IMission }>({
        path: "missionId",
        select: "name",
        options: { sort: { [orderBy]: order } },
      })
      .populate<{ flightId: IFlight }>({
        path: "flightId",
        select: "name",
        options: { sort: { [orderBy]: order } },
      })
      .populate<{ createdBy: IUser }>({
        path: "createdBy",
        options: { sort: { [orderBy]: order } },
      })
      .limit(Number(limit))
      .skip(startIndex);
    if (result.length) {
      res.status(200).json({
        status: true,
        message: "Alert fetched successfully",
        data: result,
        total: result.length,
      });
    } else {
      res.status(404).json({
        status: false,
        message: "Wrong input ",
      });
    }
  }
};

// get all alerts of a mission
export const fetchAllAlertsByMissionMapref = async (
  req: Request,
  res: AuthResponse
) => {
  {
    const data = await Alert.find(
      {
        missionId: new Types.ObjectId(String(req.query.id)),
        $or: [
          { tenantId: res.locals.user.tenantId._id },
          { createdBy: res.locals.user._id },
        ],
      },
      {
        image: 1,
        location: 1,
        missionId: 1,
      }
    ).populate<{ missionId: IMission }>({
      path: "missionId",
      match: { tenantId: res.locals.user.tenantId._id },
    });
    const result: any[] = [];
    for (let i = 0; i < data.length; i++) {
      result.push({
        alertID: data[i]._id,
        alertImage: data[i].image,
        coordinated: data[i].location,
        missionName: data[i].missionId.name,
      });
    }
    if (result.length) {
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
  }
};

//test api for injecting custom locationID,flightID and missionID on to specified no of alerts.

export const testApiinject = async (req: Request, res: AuthResponse) => {
  {
    // let missionId = Types.ObjectId(String(req.body.id));
    const data = await Alert.find({});
    // .limit(req.body.limit);
    const savedDoc = await Promise.all(
      data.map(async (d) => {
        // d.createdBy = req.body.userId;
        // d.locationId = req.body.locationId;
        //d.missionId = req.body.missionId;
        //d.flightId = req.body.flightId;
        d.tenantId = req.body.tenantId;
        return await d.save();
      })
    );
    if (savedDoc) {
      res.status(200).json({
        status: true,
        message: "Injected successfully",
        data: savedDoc,
      });
    } else {
      res.status(404).json({
        status: false,
        message: "Error in injecting",
      });
    }
  }
};

export const fetchAllAlertByLocationIdAndTime = async (
  req: Request,
  res: AuthResponse
) => {
  {
    const timeStr = String(req.query.time);
    const time = Number(timeStr.split(" ")[0]);
    //let time = Number(req.body.time.split(" ")[0]);
    const timeType = timeStr.split(" ")[1];
    //let timeType = String(req.body.time.split(" ")[1]).toLowerCase();

    const endTime = new Date();
    let startTime: Date;
    switch (timeType) {
      case "days":
      case "day":
        startTime = subDays(endTime, time);
        break;

      case "weeks":
      case "week":
        startTime = subWeeks(endTime, time);
        break;

      case "months":
      case "month":
        startTime = subMonths(endTime, time);
        break;

      case "years":
      case "year":
        startTime = subYears(endTime, time);
        break;

      default:
        throw `Invalid time ${req.query.time.toString()}`;
    }
    const data = await Alert.find(
      {
        locationId: new Types.ObjectId(String(req.query.locationID)),
        createdAt: {
          $gte: startTime,
          $lte: endTime,
        },
        $or: [
          { tenantId: res.locals.user.tenantId._id },
          { createdBy: res.locals.user._id },
        ],
      },
      {
        image: 1,
        location: 1,
      }
    );

    const result: any[] = [];

    for (let i = 0; i < data.length; i++) {
      result.push({
        alertID: data[i]._id,
        alertImage: data[i].image,
        coordinates: data[i].location,
      });
    }
    if (data.length) {
      res.status(200).json({
        status: true,
        message: `Total Alerts for ${req.query.locationID.toString()} is ${
          data.length
        }`,
        data: result,
      });
    } else {
      res.status(404).json({
        status: false,
        message: `No Alerts Alerts for ${req.query.locationID.toString()} in this time span`,
      });
    }
  }
};

// only for development purpose
export const updateAlertIds = async (req: Request, res: AuthResponse) => {
  {
    const missionID = req.body.missionID;
    const flightID = req.body.flightID;
    const createdBy = req.body.createdBy;
    const tenantID = req.body.tenantID;
    const locationID = req.body.locationID;

    await Alert.updateMany(
      {},
      {
        locationId: locationID,
        missionId: missionID,
        flightId: flightID,
        createdBy: createdBy,
        tenantId: tenantID,
      }
    );

    res.json({
      success: true,
      message: "Alerts modified",
    });
  }
};

// alerts by tenant id
export const fetchAllAlertByTenantId = async (
  req: Request,
  res: AuthResponse
) => {
  {
    let data = [];
    if (req.query.time) {
      const timeStr = String(req.query.time);
      const time = Number(timeStr.split(" ")[0]);

      const timeType = timeStr.split(" ")[1];

      const endTime = new Date();
      let startTime: Date;
      switch (timeType) {
        case "days":
        case "day":
          startTime = subDays(endTime, time);
          break;

        case "weeks":
        case "week":
          startTime = subWeeks(endTime, time);
          break;

        case "months":
        case "month":
          startTime = subMonths(endTime, time);
          break;

        case "years":
        case "year":
          startTime = subYears(endTime, time);
          break;

        default:
          throw `Invalid time ${req.query.time.toString()}`;
      }
      data = await Alert.find(
        {
          tenantId: new Types.ObjectId(res.locals.user.tenantId._id),
          createdAt: {
            $gte: startTime,
            $lte: endTime,
          },
        },
        {
          image: 1,
          location: 1,
        }
      );
    } else {
      data = await Alert.find(
        {
          tenantId: new Types.ObjectId(res.locals.user.tenantId._id),
        },
        {
          image: 1,
          location: 1,
        }
      );
    }

    const result: any[] = [];

    for (let i = 0; i < data.length; i++) {
      result.push({
        alertID: data[i]._id,
        alertImage: data[i].image,
        coordinates: data[i].location,
      });
    }

    const count = await Alert.countDocuments({
      tenantId: res.locals.user.tenantId._id,
    });

    if (data.length) {
      res.status(200).json({
        status: true,
        message: `Total Alerts are ${data.length}`,
        data: result,
        count: count,
      });
    } else {
      res.status(404).json({
        status: false,
        message: `No Alerts Alerts found`,
      });
    }
  }
};

// advanced alert results by tenant id
export const advancedAlertResultByTenantId = async (
  req: Request,
  res: AuthResponse
) => {
  {
    const { timeRange, time, page, limit, user } = req.query;

    let createdAt: { $gte: Date; $lte: Date };

    if (timeRange) {
      const timeStr = String(timeRange).split(" ");
      const startTime = new Date(timeStr[0]);
      const endTime = new Date(timeStr[1]);
      createdAt = {
        $gte: startTime,
        $lte: endTime,
      };
    } else if (time) {
      const timeStr = String(time);

      const timeValue = Number(timeStr.split(" ")[0]);
      const timeType = timeStr.split(" ")[1];

      const endTime = new Date();
      let startTime: Date;
      switch (timeType) {
        case "days":
        case "day":
          startTime = subDays(endTime, timeValue);
          break;

        case "weeks":
        case "week":
          startTime = subWeeks(endTime, timeValue);
          break;

        case "months":
        case "month":
          startTime = subMonths(endTime, timeValue);
          break;

        case "years":
        case "year":
          startTime = subYears(endTime, timeValue);
          break;

        default:
          throw `Invalid time ${time.toString()}`;
      }
      createdAt = {
        $gte: startTime,
        $lte: endTime,
      };
    }

    //Pagination
    const startIndex = (Number(page) - 1) * Number(limit);

    const data = await Alert.find({
      [createdAt && "createdAt"]: createdAt,
      [user && "createdBy"]: user,
      tenantId: res.locals.user.tenantId._id,
    })
      .skip(startIndex)
      .limit(Number(limit));

    const total = data.length;

    if (data.length) {
      res.json({
        status: true,
        message: `Total Alerts are ${data.length}`,
        data: data,
        total,
      });
    } else {
      res.json({
        status: false,
        message: `No Alerts Alerts found`,
      });
    }
  }
};

export const convertImageToThumbnail = async (
  req: Request,
  res: AuthResponse
) => {
  const result = await Alert.find({
    $or: [
      { tenantId: res.locals.user.tenantId._id },
      { createdBy: res.locals.user._id },
    ],
  });
  if (result.length) {
    for (let i = 0; i < result.length; i++) {
      await saveThumbnails(pathUtils.docPath(pathUtils.Directory.ROOT, result[i].image));
    }
    res.status(200).json({
      status: true,
      message: " All images converted to thumbnail successfully!",
    });
  } else {
    res.status(403).json({
      status: false,
      message: "Alerts data not found! ",
    });
  }
};

export const deleteMultipleAlerts = async (req: Request, res: AuthResponse) => {
  {
    const data = req.body.id;
    let flag = 0;
    if (data.length) {
      for (let i = 0; i < data.length; i++) {
        const d = await Alert.findOne(
          {
            _id: data[i],
            tenantId: res.locals.user.tenantId._id,
          },
          {
            image: 1,
            fileSize: 1,
          }
        );
        if (d) {
          const doc = await d.delete();
          const fileName = path.parse(d.image).base;
          await deleteDirFileUsingName(Directory.ALERT_IMAGES, fileName);
          await deleteDirFileUsingName(
            Directory.ALERT_IMAGES,
            "1x_" + fileName
          );
          const tenant = await Tenant.findOne({
            _id: res.locals.user.tenantId,
          });
          if (doc && tenant.actualAlertCount >= 0) {
            await Tenant.updateOne(
              { _id: res.locals.user.tenantId },
              { $inc: { actualAlertCount: -1 } }
            );
          }
          if (doc) {
            flag = 1;
          }
        }
      }
      if (flag == 1) {
        res.status(200).json({
          status: true,
          message: "Alerts deleted successfully!",
        });
      } else {
        res.status(200).json({
          status: false,
          message: "Failed to delete alerts",
        });
      }
    } else {
      res.status(403).json({
        status: false,
        message: "Please send the alert Id",
      });
    }
  }
};

export const manualUploadAlert = async (req: Request, res: AuthResponse) => {
  {
    const img_path = pathUtils.docPath(pathUtils.Directory.ALERT_IMAGES, req.file.filename);
    const thumbs = await saveThumbnails(img_path);
    const ff = await readCoords(img_path);

    const { locationName, missionId, locationId, flightId, pcount, type } =
      req.body;
    req.body.location = {
      lat: ff ? ff.lat: 0,
      long: ff ? ff.lng : 0,
    };
    const newAlert = new Alert({
      locationName,
      location: req.body.location ? req.body.location : null,
      missionId,
      locationId,
      createdBy: res.locals.user._id,
      flightId,
      tenantId: res.locals.user.tenantId,
      pcount,
      note: req.body.note ? req.body.note : "",
      onSite: req.body.onSite,
      type,
      fileSize: thumbs.size,
      image: img_path
    });

    const data = await newAlert.save();
    const tenant = await Tenant.findOne({ _id: res.locals.user.tenantId });
    if (data && tenant.actualAlertCount >= 0) {
      await Tenant.updateOne(
        { _id: res.locals.user.tenantId },
        { $inc: { actualAlertCount: 1 } }
      );
    }
    res.status(201).json({
      status: true,
      message: "New alert created",
      data,
    });
  }
};

export const updateAlert = async (req: Request, res: AuthResponse) => {
  {
    const Id = new Types.ObjectId(String(req.body.id));
    const updatedDoc = await Alert.findOneAndUpdate(
      { _id: Id, tenantId: res.locals.user.tenantId._id },
      req.body.update,
      {
        new: true,
      }
    );

    if (updatedDoc) {
      res.json({
        status: true,
        message: "Alert updated sucessfully.",
        data: updatedDoc,
      });
    } else {
      res.status(404).json({
        status: false,
        message: "Alert could not be updated.",
      });
    }
  }
};

export const updateMultiAlert = async (req: Request, res: AuthResponse) => {
  {
    const Ids: String[] = req.body.Id.map((id: any) => String(id));

    const updatedDoc = await Alert.updateMany(
      { _id: { $in: Ids }, tenantId: res.locals.user.tenantId._id },
      { $set: req.body.update },
      { multi: true }
    );
    console.info(Ids, updatedDoc);
    const doc = await Alert.find({
      _id: { $in: Ids },
      tenantId: res.locals.user.tenantId._id,
    })
      .populate<{ flightId: IFlight }>("flightId")
      .populate<{ missionID: IMission }>("missionId");
    if (updatedDoc) {
      res.json({
        status: true,
        message: "Alerts updated sucessfully.",
        data: doc,
      });
    } else {
      res.status(404).json({
        status: false,
        message: "Alerts could not be updated.",
      });
    }
  }
};
