import { logFace } from "./interfaceUtils";
import { Request, Response } from "express";
import fs from "fs";
import { LOG_DIR } from "../constants";
import path from "path";
import onfinished from "on-finished";
import { IUser } from "../schemas/user";
type ManLog = {
  level: "info" | "error" | "warn" | "debug";
  message: any | any[];
};
type LogObject = {
  url: Request["url"];
  method: Request["method"];
  status: Response["statusCode"];
  time: Date;
  // headers: Request["headers"];
  query: Request["query"];
  body: Request["body"];
  manLogs: Array<ManLog>;
};
export interface Log {
  info(...message: any[]);
  error(...message: any[]);
  warn(...message: any[]);
  debug(...message: any[]);
}

export class ConsoleLogger implements Log {
  info(...message: any[]) {
    console.log("INFO", ...message);
  }
  error(...message: any[]) {
    console.log("ERROR", ...message);
  }
  warn(...message: any[]) {
    console.log("WARN", ...message);
  }
  debug(...message: any[]) {
    console.log("DEBUG", ...message);
  }
}

export class Logger implements Log {
  fileHandle: fs.WriteStream;
  logObj: LogObject;
  constructor(req: Request, res: Response, user: IUser) {
    const date = new Date();
    this.fileHandle = fs.createWriteStream(
      path.join(
        LOG_DIR,
        `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${
          user.email
        }.log`
      ),
      { flags: "a" }
    );
    this.logObj = {
      url: req.originalUrl,
      method: req.method,
      status: 0,
      time: new Date(),
      // headers: req.headers,
      query: req.query,
      body: req.body,
      manLogs: [],
    };
    onfinished(res, () => {
      this.logObj.status = res.statusCode;
      this.logObj.body = req.body;
      this.fileHandle.write(JSON.stringify(this.logObj, null, "\t") + "\n");
      this.fileHandle.end();
    });
  }
  format(manlog: ManLog) {
    const messages: any[] = [];
    for (let i = 0; i < manlog.message.length; i++) {
      const message = manlog.message[i];
      if (message instanceof Error) {
        messages.push({
          name: message.name,
          stack: message.stack?.split("\n").map((line) => line.trim()),
        });
      } else {
        messages.push(message);
      }
    }
    this.logObj.manLogs.push({
      level: manlog.level,
      message: messages.length == 1 ? messages[0] : messages,
    });
  }
  info(...message: any[]) {
    this.format({ level: "info", message: message });
  }
  error(...message: any[]) {
    this.format({ level: "error", message: message });
  }
  warn(...message: any[]) {
    this.format({ level: "warn", message: message });
  }
  debug(...message: any[]) {
    this.format({ level: "debug", message: message });
  }
}

export function logger(
  req: Request,
  res: Response,
  message: string,
  status: number,
  error?: Error
): logFace {
  return {
    status: status,
    route: req.baseUrl + req.url,
    userID: String(req.headers.userid),
    timestamp: new Date(),
    message: message,
  };
}

export function generateLog(mission: any, flight: any) {
  console.log(flight);
  return {
    date: flight.date,
    time: flight.time,
    missionID: String(mission._id),
    assetID: String(mission.assetID),
    duration: flight.duration,
    location: flight.geoLocation,
    geofence: JSON.stringify(flight?.geoFence),
    flightArea: flight.geoFence.polygon.area,
    pilotName: flight.pilotID?.name,
    jobType: mission.missionType?.name,
    deliverables: mission?.deliverables || "",
    locationID: flight.locationID,
  };
}
