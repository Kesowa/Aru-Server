/// Wipro ICCC Integration Utils

import path from "path";

import { Logger } from "pino";

import { API_SERVER, LIVE_URL, MODE, Mode } from "../constants";
import Location from "../models/location";
import { IAlert } from "../schemas/alert";
import { IStreamKey } from "../schemas/streamKey";


export class WiproInterface {
  private static readonly ServerURL =
    MODE == Mode.Prod ? "https://iccc.ntkiccc.in" : "http://127.0.0.1";
  private static readonly username = "wipro";
  private static readonly password = "CredKol@123";
  private static readonly AlertURL = new URL(
    "/newtown/insertalert",
    WiproInterface.ServerURL
  );
  private static readonly LiveURL = new URL(
    "/newtown/cameradata",
    WiproInterface.ServerURL
  );
  private static readonly StatusURL = new URL(
    "/newtown/insertcamerastatus",
    WiproInterface.ServerURL
  );
  private static readonly BaseURL = new URL("/", API_SERVER);
  private static readonly Headers = {
    Authorization:
      "Basic " +
      Buffer.from(
        `${WiproInterface.username}:${WiproInterface.password}`,
        "binary"
      ).toString("base64"),
    "Content-Type": "application/json",
  };
  private static readonly LiveStreamURL = new URL(LIVE_URL);

  public static async SendStatus(
    live: { flightID: string },
    status: "Disconnect"
  ) {
    const data = {
      cameraID: live.flightID,
      status: status,
    };
    try {
      const res = await fetch(WiproInterface.StatusURL, {
        method: "POST",
        headers: this.Headers,
        body: JSON.stringify(data),
      });
      console.info("Sent status to wipro!", data);
      return res.ok;
    } catch (error) {
      return false;
    }
  }

  public static async SendAlert(alert: IAlert, ipAddr: string, log: Logger) {
    const data = {
      cameraId: alert.flightId,
      camName: "Cam 4",
      ip: ipAddr,
      eventName: alert.type,
      message: alert.note,
      location: alert.locationName,
      alertTime: alert.createdAt,
      snapshot: new URL(alert.image, WiproInterface.BaseURL),
      severity: "Low",
      latitude: alert.location.lat,
      longitude: alert.location.long,
    };
    try {
      const res = await fetch(WiproInterface.AlertURL, {
        method: "POST",
        headers: this.Headers,
        body: JSON.stringify(data),
      });
      log.info("Sent alert to wipro!");
      return res.ok;
    } catch (error) {
      log.error(error);
      return false;
    }
  }

  public static async SendLive(live: IStreamKey, ipAddr: string) {
    let location = {
      properties: {
        name: "Default",
      },
      geometry: {
        coordinates: {
          lat: 0,
          lng: 0,
        },
      },
    };

    if (live.locationID) location = await Location.findById(live.locationID);

    const dataTemplate = (url: string) => ({
      camtype: "PTZ",
      camName: "Sample Camera 1",
      cameraId: live.flightID,
      ip: ipAddr,
      status: "Connect",
      location: location?.properties.name,
      latitude: location?.geometry.coordinates.lat,
      longitude: location?.geometry.coordinates.lng,
      liveViewUrl: new URL(
        path.join("/live", url),
        WiproInterface.LiveStreamURL
      ).toString(),
      todate: live.createdAt.toLocaleString(),
    });

    const liveURLs = [
      `${live.streamKey}.m3u8`,
      `${live.streamKey}_480p1128kbs/index.m3u8`,
      `${live.streamKey}_720p2628kbs/index.m3u8`,
    ];

    const all_streams = liveURLs.map(dataTemplate);
    try {
      const res = await fetch(WiproInterface.LiveURL, {
        method: "POST",
        headers: WiproInterface.Headers,
        body: JSON.stringify(all_streams),
      });
      console.info("Sent Livestream to Wipro!", all_streams);
      return res.ok;
    } catch (error) {
      return false;
    }
  }
}
