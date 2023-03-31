import { Request } from "express";
import { SortOrder, Types } from "mongoose";
import format from "date-fns/format";
import path from "path";
import fs from "fs";
import VOD from "../../models/vod";
import { AuthResponse } from "../../utils/interfaceUtils";
import { generateToken } from "./streamTokenController";
import { VODEvents } from "../../utils/videoUtils";
import Tenant from "../../models/tenant";
import { missionSpecificSocket } from "../../socket";
import { IFlight } from "../../schemas/flight";
import { IMission } from "../../schemas/mission";
import { ARU_INSTANCE, Directory, DirPath, Instance } from "../../constants";
import { WiproInterface } from "../../utils/wipro";
import {
  deleteDirFileUsingName,
  deleteDirFolderUsingName,
  deleteHlsVodUsingIndex,
  deletePublicFileUsingPath,
} from "../../utils/fileDeleteUtils";
import Flight from "../../models/flight";

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
    const stats = await fs.promises.stat(
      DirPath(Directory.VOD, `${req.body.filename}.flv`)
    );
    const VODdoc = new VOD({
      flightID: flightID,
      missionID: missionID,
      locationID: locationID,
      videoPath: `/vod/${req.body.filename}.m3u8`,
      thumbnail: `/vod/${req.body.filename}.jpg`,
      tenantId: tenantId,
      videoName: req.body.filename,
      fileSize: stats.size / (1024 * 1024),
    });
    const dbsave = await VODdoc.save();
    const tenant = await Tenant.findOne({ _id: tenantId });
    if (dbsave && tenant.actualVodCount >= 0) {
      await Tenant.updateOne(
        { _id: tenantId },
        { $inc: { actualVodCount: 1 } }
      );
      // tenant.actualVodCount = Number(tenant.actualVodCount) + 1;
      // await tenant.save();
    }
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
    if (req.query.flightID != undefined) {
      const flightID = new Types.ObjectId(String(req.query.flightID));
      const page = Number(req.query.page);
      const len = await VOD.countDocuments({
        flightID: flightID,
        tenantId: res.locals.user.tenantId._id,
      });
      const doc = await VOD.find({
        flightID: flightID,
        tenantId: res.locals.user.tenantId._id,
      })
        .skip(page * 10)
        .limit(10);
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
    } else {
      if (req.query.locationID != undefined) {
        const vod = await VOD.find({
          locationID: new Types.ObjectId(String(req.query.locationID)),
        });
        if (vod.length) {
          res.json({
            status: true,
            message: "sucessfully fetched the VODs",
            data: vod,
          });
        } else {
          res.status(404).json({
            status: false,
            message: "Wrong input",
          });
        }
      } else {
        res.status(404).json({
          status: false,
          message: "An error occured",
        });
      }
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
  {
    const tenantId = String(res.locals.user.tenantId._id);
    let { missionID, flightID, locationID } = req.body;
    const token = generateToken(missionID, flightID, locationID, tenantId);
    const timestamp = format(new Date(), "dd-MMM-yy-hh-mm-ss");
    const filename = `${token}-${timestamp}`;
    if (locationID == null || locationID == undefined) {
      const flight = await Flight.findOne(
        { _id: flightID, tenant: tenantId },
        { locationID: 1 }
      );
      locationID = flight.locationID;
      if (locationID == null || locationID == undefined) {
        locationID = new Types.ObjectId("5f202f03b9225726102721b8");
      }
    }
    if (req.file) {
      const originalName = req.file.originalname;
      const fullPath = req.file.path;
      const fullPath2 = DirPath(Directory.VOD);
      const tenantID = res.locals.user.tenantId._id;
      const size: number = Number(
        (Number(req.file?.size) / (1024 * 1024)).toFixed(5)
      );
      // let size: number = fileSizes(filename)
      VODEvents.emit("PROCESS_VIDEO", {
        missionID,
        flightID,
        fullPath2,
        locationID,
        fullPath,
        filename,
        tenantID,
        originalName,
        size,
      });
      res.json({
        status: true,
        message: "Sucessfully uploaded the video",
        file: `temp/${filename}.mp4`,
      });
    }
  }
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
      const docpath = doc.videoPath;
      // TODO: Put HLS chunks for a video in a single folder, then replace this
      const indexFile = path.parse(docpath).base;
      const vodDir = path.parse(docpath).name;
      const conf = await deleteHlsVodUsingIndex(vodDir, indexFile);
      await deletePublicFileUsingPath(doc.thumbnail);
      await deleteDirFileUsingName(
        Directory.VOD,
        `${vodDir}/${vodDir}.flv`
      );
      await deleteDirFolderUsingName(Directory.VOD, vodDir);
      if (conf) {
        req.log.info("Files deleted");
      } else {
        req.log.warn("Files does not exist");
      }
    } else {
      res.status(404).json({
        status: false,
        message: "VOD Files of _id:" + Id + " doesnt exist",
      });
      return;
    }
    const resp = await doc.delete();
    const tenant: any = await Tenant.findOne({ _id: res.locals.user.tenantId });
    if (resp && tenant.actualVodCount) {
      await Tenant.updateOne(
        { _id: res.locals.user.tenantId },
        { $inc: { actualVodCount: -1 } }
      );
      // tenant.actualVodCount = Number(tenant.actualVodCount) - 1;
      // await tenant.save();
    }
    if (resp) {
      missionSpecificSocket
        .to(String(resp.missionID))
        .emit("VOD_REMOVED", resp);
      res.status(200).json({
        status: true,
        message: "Successfully deleted _id:" + Id,
        data: resp,
      });
    } else {
      res.status(404).json({
        status: false,
        message: "VOD of _id:" + Id + " doesnt exist",
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
        const docpath = doc.videoPath;
        const indexFile = path.parse(docpath).base;
        const vodDir = path.parse(docpath).name;
        const conf = await deleteHlsVodUsingIndex(vodDir, indexFile);
        await deletePublicFileUsingPath(doc.thumbnail);
        await deleteDirFileUsingName(
          Directory.VOD,
          `${vodDir}/${vodDir}.flv`
        );
        await deleteDirFolderUsingName(Directory.VOD, vodDir);
        if (conf) {
          req.log.info("Files deleted");
        } else {
          req.log.warn("Files does not exist");
          errors.push(doc._id.toString());
          continue;
        }

        const res2 = await VOD.findByIdAndDelete(doc._id);
        if (res2) {
          deleted.push(doc._id.toString());
          await Tenant.updateOne(
            { _id: res2.tenantId },
            {
              $inc: {
                actualVodCount: -1,
                actualSize: -doc.fileSize,
              },
            }
          );
        }
        missionSpecificSocket
          .to(String(doc.missionID))
          .emit("VOD_REMOVED", doc);
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
