import { Request } from "express";
import { SortOrder, Types } from "mongoose";
import VOD from "../../models/vod";
import { AuthResponse } from "../../utils/interfaceUtils";
import { transcodeVideo } from "../../utils/videoUtils";
import Tenant from "../../models/tenant";
import { missionSpecificSocket } from "../../socket";
import { IFlight } from "../../schemas/flight";
import { IMission } from "../../schemas/mission";
import { ARU_INSTANCE, Instance } from "../../constants";
import { WiproInterface } from "../../utils/wipro";
import Flight from "../../models/flight";
import * as pathUtils from "../../utils/pathUtils";
import Location from "../../models/location";
import UploadTask from "../../models/uploadTask";
import { permPath } from "../../utils/dataUtils";

export const saveVOD = async (
  req: Request<
    {},
    {},
    {
      filename: string;
    }
  >,
  res: AuthResponse
) => {
  {
    const filename = req.body.filename;
    const streamKey = filename.split("-")[0];
    const temp = Buffer.from(streamKey, "base64").toString();
    const [missionID, flightID, locationID, tenantId] = temp.split("-");
    req.log.info(
      "++++++++++++++++++++++++++++SAVING VOD++++++++++++++++++++++++++++++++++++++++++"
    );
    req.log.info(missionID + flightID + locationID + tenantId);
    if (ARU_INSTANCE == Instance.NKDA) {
      req.log.info("Sending status info to Wipro...");
      setTimeout(() => {
        void WiproInterface.SendStatus({ flightID }, "Disconnect")
          .then((sent) => console.info("Sent status info to Wipro!", sent))
          .catch(console.error);
      }, 10_000);
    }
    const vodSize = 1; // !TODO
    const VODdoc = new VOD({
      flightID: flightID,
      missionID: missionID,
      locationID: locationID,
      videoPath: `/vod/${req.body.filename}.m3u8`,
      thumbnail: `/vod/${req.body.filename}.jpg`,
      tenantId: tenantId,
      videoName: req.body.filename,
      fileSize: vodSize,
    });
    const dbsave = await VODdoc.save();
    return res.json({
      status: true,
      message: `VOD saved with ${dbsave._id.toString()}`,
      data: dbsave,
    });
  }
};
const SortToNum = (qry: string) => {
  switch (qry) {
    case "asc":
      return 1;
    case "desc":
      return -1;
    default:
      return undefined;
  }
};

export const getVODByID = async (req: Request, res: AuthResponse) => {
  {
    const Ids: String[] = req.body.Id.map((id: any) => String(id));
    const query = {
      _id: { $in: [...Ids] },
      tenantId: res.locals.user.tenantId._id,
    };
    const docs = await VOD.find(query);
    if (docs.length) {
      res.json({
        status: true,
        message: "sucessfully fetched the VOD",
        data: docs,
      });
    } else {
      res.status(404).json({
        status: false,
        message: "No Document found",
      });
    }
  }
};

export const getByMissionID = async (req: Request, res: AuthResponse) => {
  {
    const missionID = new Types.ObjectId(String(req.query.missionID));
    const page = Number(req.query.page) || 1;
    const sortString = req.query.sort?.toString() || "createdAt:desc";
    const [sortBy, order] = sortString.split(":");
    const limit = Number(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;

    const query = {
      missionID: missionID,
      tenantId: res.locals.user.tenantId._id,
    };
    if (req.query.isFlagged !== undefined) {
      query["isFlagged"] = req.query.isFlagged;
    }
    const total = await VOD.countDocuments(query);
    const doc = await VOD.find(query)
      .sort({ [sortBy]: order as SortOrder })
      .populate<{ flightId: IFlight }>("flightID")
      .populate<{ missionID: IMission }>("missionID")
      .skip(startIndex)
      .limit(limit);
    if (doc.length) {
      missionSpecificSocket.to(String(missionID)).emit("VOD_FETCH", {
        fetchSucessfully: true,
      });
      res.json({
        status: true,
        message: "sucessfully fetched the VODs",
        TotalPages: Math.ceil(total / limit),
        total: total,
        data: doc,
      });
    } else {
      res.status(404).json({
        status: false,
        message: "No Videos found",
      });
    }
  }
};

export const getCountByMissionID = async (req: Request, res: AuthResponse) => {
  {
    const missionID = new Types.ObjectId(String(req.query.missionID));
    const len = await VOD.countDocuments({
      missionID: missionID,
      tenantId: res.locals.user.tenantId._id,
    });

    return res.json({
      status: true,
      message: "sucessfully fetched the VODs",
      data: {
        count: len,
      },
    });
  }
};

export const getByFlightOrLocationID = async (
  req: Request,
  res: AuthResponse
) => {
  {
    const { flightID, locationID, page } = req.query;

    const query = {
      tenantId: res.locals.user.tenantId._id,
      [flightID && "flightID"]: flightID,
      [locationID && "locationID"]: locationID,
    };

    const doc = await VOD.find(query)
      .skip(page ? Number(page) * 10 : 0)
      .limit(10);

    const len = await VOD.countDocuments(query);

    if (doc.length) {
      res.json({
        status: true,
        message: "sucessfully fetched the VODs",
        TotalPages: Math.ceil(len / 10),
        data: doc,
      });
    } else {
      res.status(404).json({
        status: false,
        message: "No Document found",
      });
    }
  }
};

// get All  Vod data By Location ID
export const fetchAllVoddataByLocationId = async (
  req: Request,
  res: AuthResponse
) => {
  {
    const page = Number(req.query.page);
    const limit = Number(req.query.limit);
    const startIndex = (page - 1) * limit;

    const total = await VOD.countDocuments({
      locationID: req.query.id,
      tenantId: res.locals.user.tenantId._id,
    });

    const vod = await VOD.find({
      locationID: req.query.id,
      tenantId: res.locals.user.tenantId._id,
    })
      .populate<{ flightID: IFlight }>({ path: "flightID", select: "name" })
      .limit(limit)
      .skip(startIndex);

    if (vod.length) {
      res.json({
        status: true,
        message: "sucessfully fetched the VODs",
        data: vod,
        total: total,
      });
    } else {
      res.status(404).json({
        status: false,
        message: "Wrong input",
      });
    }
  }
};

export const testApiinject = async (req: Request, res: AuthResponse) => {
  {
    const data = await VOD.find({}).limit(req.body.limit);
    const savedDoc = await Promise.all(
      data.map(async (d) => {
        d.locationID = new Types.ObjectId(req.body.locationId);
        d.missionID = new Types.ObjectId(req.body.missionId);
        d.flightID = new Types.ObjectId(req.body.flightId);
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

export const saveVODManual = async (req: Request, res: AuthResponse) => {
  const tenantId = String(res.locals.user.tenantId._id);
  let { missionID, flightID, locationID } = req.body;
  req.log.info({ missionID, flightID }, "VOD Info");
  const fileDoc = await UploadTask.findOne({
    tenant: res.locals.user.tenantId._id,
    createdBy: res.locals.user._id,
    _id: req.body.file,
    // status: "started",
  });
  if (locationID == null || locationID == undefined) {
    const flight = await Flight.findOne(
      { _id: flightID, tenant: tenantId },
      { locationID: 1 }
    );
    locationID = flight.locationID;
  }
  const fullPath = await permPath(
    pathUtils.Directory.VOD,
    fileDoc.metadata.objectkey
  );
  // const telemetryData = await extractTelemetry(filepath);
  const telemetryData = null;
  if (telemetryData) {
    const location = await Location.create({
      properties: {
        name: fileDoc.metadata.originalName,
      },
      tenantId: res.locals.user.tenantId._id,
      geometry: {
        type: "Point",
        coordinates: {
          lng: telemetryData.metadata.stats.GPS.LONGITUDE.avg,
          lat: telemetryData.metadata.stats.GPS.LATITUDE.avg,
        },
      },
    });
    locationID = location._id;
  }
  const vod = await VOD.create({
    videoName: fileDoc.metadata.originalName,
    missionID: missionID,
    flightID: flightID,
    locationID: locationID,
    videoPath: "/processing.m3u8",
    thumbnail: "/processing.png",
    originalFile: fullPath,
    tenantId: res.locals.user.tenantId._id,
    isSRT: telemetryData ? true : false,
    fileSize: fileDoc.metadata.filesize,
  });
  await transcodeVideo(fullPath, {
    location_id: locationID ?? null,
    mission_id: missionID,
    tenant_id: tenantId,
    user_id: res.locals.user._id.toString(),
    flight_id: flightID,
    video_id: vod._id.toString(),
  });

  await fileDoc.delete();

  res.json({
    status: true,
    message: "Sucessfully uploaded the video",
    file: fullPath,
    data: vod,
  });
};

//Delete VOD Entry
export const removeVOD = async (req: Request, res: AuthResponse) => {
  {
    const Id = new Types.ObjectId(String(req.body.Id));
    const doc = await VOD.findOne({
      _id: Id,
      tenantId: res.locals.user.tenantId._id,
    });
    if (doc) {
      // check if processed vod
      if (
        doc.videoPath &&
        doc.videoPath !== "/processing.m3u8" &&
        doc.thumbnail &&
        doc.thumbnail !== "/processing.png"
      ) {
        await doc.deleteFiles();
        const resp = await doc.remove();
        if (resp) {
          missionSpecificSocket
            .to(String(resp.missionID))
            .emit("VOD_REMOVED", resp);
          res.status(200).json({
            status: true,
            message: "Successfully deleted _id:" + Id.toString(),
            data: resp,
          });
        } else {
          res.status(500).json({
            status: false,
            message: "Couldn't delete VOD of _id:" + Id.toString(),
          });
        }
      } else {
        res.status(400).json({
          status: false,
          message: "Cannot delete un-processed VOD",
        });
      }
    } else {
      res.status(404).json({
        status: false,
        message: "VOD of _id:" + Id.toString() + " doesnt exist",
      });
    }
  }
};

//Delete Multiple VOD Entries
export const removeMultiVOD = async (req: Request, res: AuthResponse) => {
  {
    const Ids: String[] = req.body.Id.map((id: any) => String(id));
    const docs = await VOD.find({ _id: { $in: [...Ids] } });
    const errors: String[] = [];
    const deleted: String[] = [];
    if (docs && docs.length > 0) {
      for (let index = 0; index < docs.length; index++) {
        const doc = docs[index];
        if (
          doc.videoPath &&
          doc.videoPath !== "/processing.m3u8" &&
          doc.thumbnail &&
          doc.thumbnail !== "/processing.png"
        ) {
          await doc.deleteFiles();
          const res2 = await doc.remove();
          if (res2) {
            deleted.push(doc._id.toString());
            missionSpecificSocket
              .to(String(doc.missionID))
              .emit("VOD_REMOVED", doc);
          } else errors.push(doc._id.toString());
        } else {
          errors.push(doc._id.toString());
        }
      }
      return res.json({
        status: true,
        message: `${deleted.length} videos deleted`,
        data: {
          errors,
          deleted,
        },
      });
    } else {
      return res.status(404).json({
        status: false,
        message: "no videos found",
      });
    }
  }
};

export const testApiinjectTenantID = async (
  req: Request,
  res: AuthResponse
) => {
  {
    const doc = await VOD.find({});
    const savedDoc = await Promise.all(
      doc.map(async (d) => {
        d.tenantId = req.body.tenantID;
        return await d.save();
      })
    );

    if (savedDoc) {
      res.status(200).json({
        status: true,
        message: `Injected succefully to ${doc.length} documents`,
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

export const renameVOD = async (req: Request, res: AuthResponse) => {
  {
    const Id = new Types.ObjectId(String(req.body.id));
    const updatedDoc = await VOD.findOneAndUpdate(
      { _id: Id, tenantId: res.locals.user.tenantId._id },
      req.body.update,
      {
        new: true,
      }
    );

    if (updatedDoc) {
      res.json({
        status: true,
        message: "VOD renamed sucessfully.",
        data: updatedDoc,
      });
    } else {
      res.status(404).json({
        status: false,
        message: "VOD couldn't be renamed.",
      });
    }
  }
};

export const updateVOD = async (req: Request, res: AuthResponse) => {
  {
    const Id = new Types.ObjectId(String(req.body.id));
    const updatedDoc = await VOD.findOneAndUpdate(
      { _id: Id, tenantId: res.locals.user.tenantId._id },
      req.body.update,
      {
        new: true,
      }
    );

    if (updatedDoc) {
      res.json({
        status: true,
        message: "VOD updated sucessfully.",
        data: updatedDoc,
      });
    } else {
      res.status(404).json({
        status: false,
        message: "VOD could not be updated.",
      });
    }
  }
};

export const updateMultiVOD = async (req: Request, res: AuthResponse) => {
  {
    const Ids: String[] = req.body.Id.map((id: any) => String(id));
    const updatedDoc = await VOD.updateMany(
      { _id: { $in: Ids }, tenantId: res.locals.user.tenantId._id },
      { $set: req.body.update },
      { multi: true }
    );
    const doc = await VOD.find({
      _id: { $in: Ids },
      tenantId: res.locals.user.tenantId._id,
    })
      .populate<{ flightId: IFlight }>("flightID")
      .populate<{ missionID: IMission }>("missionID");
    if (updatedDoc) {
      res.json({
        status: true,
        message: "VOD updated sucessfully.",
        data: doc,
      });
    } else {
      res.status(404).json({
        status: false,
        message: "VOD could not be updated.",
      });
    }
  }
};
