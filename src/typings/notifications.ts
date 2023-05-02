import { IAsset } from "../schemas/asset";
import { IFlight } from "../schemas/flight";
import { ILocation } from "../schemas/location";
import { IMission } from "../schemas/mission";
import { AIRequest, droneStat } from "../utils/socketUtils";
export type NameSpaces = {
  "/stream/dronelocation": DroneLocation,
  "/stream/alert": Alert,
  "/stream/notification": Notification,
  "/stream/mission-specific": MissionSpecific,
  "/stream/mavStats": {}
}

export type DroneLocation = {
  query: {
    type: "streamer" | "receiver"
  },
  events: {
    "TELEMETRY": droneStat,
  }
}

export type AlertData = {
  image: string,
  flightId: string,
  timeStamp: string,
  tenantId: string,
  location: any,
  locationName: string,
  createdBy: string,
  fileSize: number,
  onSite: true,
  note: string,
}

export type Alert = {
  query: {
    type: "AI_SERVER" | "CLIENT_ROOM"
  },
  events: {
    "AI_WORK_START": AIRequest,
    "AI_WORK_STOP": AIRequest,
    "ALERT_CREATED": AlertData | { message: string },
  }
}

export type Notification = {
  events: {
    "ALERT_CREATED": AlertData | { message: string },
    "STREAM_GENERATED": string,
    "STREAM_REMOVED": string,
    "MISSION_ADDED": {
      mission: IMission,
      flight: IFlight
    },
    "MISSION_DELETED": {
      id: string,
      name: string,
    },
    "MISSION_COMPLETED": {
      missionID: string,
    },
    "MISSION_LIVE": {
      missionID: string,
    },
    "PILOT_ASSIGNED": {
      mission: IMission,
      name: string,
      avatar: string,
    },
    "CREATE_ASSET": IAsset,
    "UPDATE_ASSET": IAsset,
    "DELETE_ASSET": IAsset,
    "CREATE_LOCATION": ILocation,
    "UPDATE_LOCATION": ILocation,
    "DELETE_LOCATION": ILocation,
    
  }
}

export type MissionSpecific = {}
