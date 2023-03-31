import { EventEmitter } from "events";
import { exec } from "child_process";
import fs from "fs";
export const VODEvents = new EventEmitter();
import VOD from "../models/vod";
import Tenant from "../models/tenant";
import { missionSpecificSocket } from "../socket";
import DJISRTParser from "dji_srt_parser";
import mongoose from "mongoose";
import { findHlsSize } from "./fileUtils";
import { Directory, DirPath } from "../constants";
import Location from "../models/location";

// import path from "node:path";

let srtFlag = false;
let hlsFlag = false;
let data: string;
type ProcessVideoData = {
  fullPath: string;
  filename: string;
  missionID: mongoose.Types.ObjectId;
  fullPath2: string;
  flightID: mongoose.Types.ObjectId;
  locationID: mongoose.Types.ObjectId;
  tenantID: mongoose.Types.ObjectId;
  originalName: string;
};
const exitOnce = async (code: Number, d: ProcessVideoData) => {
  console.log("Hiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii");
  if (code == 0) {
    console.log(
      "SRT Extraction successful, now Exiting!---------------------------------------------------------------------"
    );
    const srtOutpath = DirPath(Directory.VOD, `${d.filename}/${d.filename}.srt`);
    const geoJSONoutPath = DirPath(Directory.VOD, `${d.filename}/${d.filename}.geojson`);
    try {
      data = await fs.promises.readFile(srtOutpath, "utf8");
    } catch (err) {
      console.error(err);
    }
    console.log(data);
    const DJIData = DJISRTParser(data, srtOutpath);
    const json = DJIData.toGeoJSON(false, true, false);
    if (json) {
      console.log("Set to true----------------------");
      srtFlag = true;
      const metadata = DJIData.metadata();
      const lat = metadata.stats.GPS.LATITUDE.avg;
      const lng = metadata.stats.GPS.LONGITUDE.avg;
      const newLocation = await Location.create({
        properties: {
          name: d.originalName,
        },
        tenantId: d.tenantID,
        geometry: {
          type: "Point",
          coordinates: { lng, lat },
        },
      });
      d.locationID = newLocation._id;
    }
    try {
      await fs.promises.writeFile(geoJSONoutPath, json);
      srtFlag = true;
    } catch (error) {
      console.error(error);
      srtFlag = false;
    }
  } else {
    srtFlag = false;
  }
  if (srtFlag == true) {
    const size1 = await findHlsSize(d.filename, d.filename + ".m3u8");

    const VODdoc = new VOD({
      flightID: d.flightID,
      missionID: d.missionID,
      locationID: d.locationID,
      videoPath: `/vod/${d.filename}/${d.filename}.m3u8`,
      thumbnail: `/vod/${d.filename}/${d.filename}.jpg`,
      fileSize: size1,
      tenantId: d.tenantID,
      videoName: d.originalName.slice(0, -4),
      isSRT: true,
    });
    const saveToDb = async () => {
      const dbsave = await VODdoc.save();
      if (dbsave) {
        console.log(dbsave);
        missionSpecificSocket
          .to(d.missionID.toString())
          .emit("PROCESS_VIDEO_FINISHED", d);
        await fs.promises.unlink(d.fullPath);
      }
      const tenant = await Tenant.findOne({ _id: d.tenantID });
      if (dbsave && tenant.actualVodCount >= 0) {
        await Tenant.updateOne(
          { _id: d.tenantID },
          { $inc: { actualVodCount: 1 } }
        );
      }
    };
    await saveToDb();
  } else {
    const size1: number = await findHlsSize(d.filename, d.filename + ".m3u8");

    const VODdoc = new VOD({
      flightID: d.flightID,
      missionID: d.missionID,
      locationID: d.locationID,
      videoPath: `/vod/${d.filename}/${d.filename}.m3u8`,
      thumbnail: `/vod/${d.filename}/${d.filename}.jpg`,
      fileSize: size1,
      tenantId: d.tenantID,
      videoName: d.originalName.slice(0, -4),
      isSRT: false,
    });
    const saveToDb = async () => {
      const dbsave = await VODdoc.save();
      if (dbsave) {
        console.log(dbsave);
        missionSpecificSocket
          .to(d.missionID.toString())
          .emit("PROCESS_VIDEO_FINISHED", d);
        await fs.promises.unlink(d.fullPath);
      }
      const tenant = await Tenant.findOne({ _id: d.tenantID });
      if (dbsave && tenant.actualVodCount >= 0) {
        await Tenant.updateOne(
          { _id: d.tenantID },
          { $inc: { actualVodCount: 1 } }
        );
      }
    };
    saveToDb()
      .then(() => console.log(`Saved video ${d.filename} to db`))
      .catch((err) =>
        console.error(`Failed to save video ${d.filename} to db`, err)
      );
  }
};
const videoProcessHandler = async (d: ProcessVideoData) => {
  console.log("Now Starting");
  try{
    await fs.promises.mkdir(DirPath(Directory.VOD, d.filename), { recursive: true });
  } catch (err) {
    console.error("Failed to create directory for VOD:")
    console.error(err)
    return;
  }
  const ps = exec(
    `/opt/ffmpeg/ffmpeg -i "${
      d.fullPath
    }" -c:v libx264 -b:v 2500k -g 30 -r 30 -s 1280x720 -preset fast -profile:v baseline -hls_list_size 0 -f hls "${DirPath(Directory.VOD,
      `${d.filename}/${d.filename}.m3u8`
    )}" -ss 00:00:05.000 -vframes 1 "${DirPath(Directory.VOD,
      `${d.filename}/${d.filename}.jpg`
    )}" "${DirPath(Directory.VOD, `${d.filename}/${d.filename}.flv`)}"`,
    (error, stdout, stderr) => {
      if (error) console.error(error);
      if (stderr) console.error(stderr);
      if (stdout) console.info("video conversion complete", d);
    }
  );

  missionSpecificSocket
    .to(d.missionID.toString())
    .emit("PROCESS_VIDEO_STARTED", d);
  console.log(d);
  const onExit = (exitCode: number) => {
    console.log(
      "File conversion successful, now Existing!---------------------------------------------------------------------"
    );
    if (exitCode == 0) {
      hlsFlag = true;
      if (hlsFlag == true) {
        console.log("Now Starting SRT extraction");
        const pss = exec(
          `/opt/ffmpeg/ffmpeg -i "${d.fullPath}" -map 0:s:0 "${DirPath(Directory.VOD,
            `${d.filename}/${d.filename}.srt`
          )}"`,
          (error, stdout, stderr) => {
            if (error) console.error(error);
            if (stderr) console.error(stderr);
            if (stdout) console.info("video conversion complete", d);
          }
        );
        pss.once("exit", (code) => {
          exitOnce(code, d).then(console.log).catch(console.error);
        });
        // pss?.stdout?.on("data", console.log);
        // pss?.stdout?.on("close", console.log);
        // pss?.stdout?.on("error", (err) => {
        //   srtFlag = false;
        //   console.error("Failed to save srt", d.filename, err);
        // });
        // pss?.on("message", console.log);
        // pss?.stderr?.on("data", console.error);
        // pss?.stderr?.on("end", console.error);
      }
    }
  };

  ps.once("exit", onExit);

  // ps?.stdout?.on("data", console.log);
  // ps?.stdout?.on("close", console.log);
  // ps?.stdout?.on("error", console.error);
  // ps?.on("message", console.log);
  // ps?.stderr?.on("data", console.error);
  // ps?.stderr?.on("end", console.error);
};

VODEvents.on("PROCESS_VIDEO", videoProcessHandler);
