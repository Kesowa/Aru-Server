import type { IAsset } from "../schemas/asset";
import { IDocument } from "../schemas/document";
import type { IFlight } from "../schemas/flight";
import { ILayer } from "../schemas/layer";
import type { ILocation } from "../schemas/location";
import type { IMission } from "../schemas/mission";
import { IVOD } from "../schemas/VOD";
import type { AIRequest, droneStat } from "../utils/socketUtils";
import type { ProcessVideoData } from "../utils/videoUtils";

export type NameSpaces = {
  "/stream/dronelocation": DroneLocation;
  "/stream/alert": Alert;
  "/stream/notification": Notification;
  "/stream/mission-specific": MissionSpecific;
  "/stream/mavStats": {};
};

export type DroneLocation = {
  query: {
    type: "streamer" | "receiver";
  };
  events: {
    TELEMETRY: droneStat;
  };
};

export type AlertData = {
  image: string;
  flightId: string;
  timeStamp: string;
  tenantId: string;
  location: any;
  locationName: string;
  createdBy: string;
  fileSize: number;
  onSite: true;
  note: string;
};

export type Alert = {
  query: {
    type: "AI_SERVER" | "CLIENT_ROOM";
  };
  events: {
    AI_WORK_START: AIRequest;
    AI_WORK_STOP: AIRequest;
    ALERT_CREATED: AlertData | { message: string };
  };
};

export type Notification = {
  events: {
    ALERT_CREATED: AlertData | { message: string };
    STREAM_GENERATED: string;
    STREAM_REMOVED: string;
    MISSION_ADDED: {
      mission: IMission;
      flight: IFlight;
    };
    MISSION_DELETED: {
      id: string;
      name: string;
    };
    MISSION_COMPLETED: {
      missionID: string;
    };
    MISSION_LIVE: {
      missionID: string;
    };
    PILOT_ASSIGNED: {
      mission: IMission;
      name: string;
      avatar: string;
    };
    CREATE_ASSET: IAsset;
    UPDATE_ASSET: IAsset;
    DELETE_ASSET: IAsset;
    CREATE_LOCATION: ILocation;
    UPDATE_LOCATION: ILocation;
    DELETE_LOCATION: ILocation;
  };
};

export type MissionSpecific = {
  query: {
    missionID: string,
  },
  events: {
    "PROCESS_VIDEO_FINISHED": ProcessVideoData,
    "PROCESS_VIDEO_STARTED": ProcessVideoData,
    "VOD_REMOVED": IVOD,
    "ASSIGNED SUCESSFULLY": {
      layerName: string,
      data: any,
      badImages: any[]
    },
    "LAYER_ZIP_START": {},
    "LAYER_ZIP_COMPLETED": string // relative path to zip,
    "LAYER_ZIP_FAILED": {},
    "pic-to-map": {badImages: any[], result: ILayer},
    "POINTCLOUD_EXTRACTION_COMPLETED": IDocument,
    "POINTCLOUD_EXTRACTION_FAILED": {},
    "DOCUMENT_CREATED": IDocument,
    "DOCUMENT_DELETED": IDocument,
    "DOCUMENT_ZIP_START": {},
    "DOCUMENT_ZIP_COMPLETED": string // relative path to zip,
    "DOCUMENT_ZIP_FAILED": {},
  }
}
