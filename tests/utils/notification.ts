import { io } from "socket.io-client";
import { APP_URL } from "./utils";

enum Namespace {
  DroneLocation = "/stream/dronelocation",
  AlertStream = "/stream/alert",
  Notification = "/stream/notification",
  Mission = "/stream/mission-specific",
  Mavlink = "/stream/mavStats",
};

enum DroneLocation {
  DRONE_STAT = "DRONE_STAT",
  GEN_LOG = "GEN_LOG",
}

enum AlertStream {
  ALERT = "ALERT",
  AI_START = "AI_START",
  AI_STOP = "AI_STOP",
}

enum Notification {
  ALERT_CREATED = "ALERT_CREATED",
  STREAM_GENERATED = "STREAM_GENERATED",
  STREAM_REMOVED = "STREAM_REMOVED",
  AI_TASK_PROGRESS = "AI_TASK_PROGRESS",
  AI_TASK = "AI_TASK",
  MISSION_ADDED = "MISSION_ADDED",
  MISSION_DELETED = "MISSION_DELETED",
  MISSION_COMPLETED = "MISSION_COMPLETED",
  MISSION_LIVE = "MISSION_LIVE",
  PILOT_ASSIGNED = "PILOT_ASSIGNED",
  CREATE_LOCATION = "CREATE_LOCATION",
  UPDATE_LOCATION = "UPDATE_LOCATION",
  DELETE_LOCATION = "DELETE_LOCATION",
}

enum Mission {
  PROCESS_VIDEO_FINISHED = "PROCESS_VIDEO_FINISHED",
  PROCESS_VIDEO_FAILED = "PROCESS_VIDEO_FAILED",
  PROCESS_ZIP_FINISHED = "PROCESS_ZIP_FINISHED",
  PROCESS_ZIP_FAILED = "PROCESS_ZIP_FAILED",
  VOD_FETCH = "VOD_FETCH",
  VOD_REMOVED = "VOD_REMOVED",
  ASSIGNED  = "ASSIGNED SUCESSFULLY",
  LAYER_ZIP_START = "LAYER_ZIP_START",
  LAYER_ZIP_COMPLETED = "LAYER_ZIP_COMPLETED",
  LAYER_ZIP_FAILED = "LAYER_ZIP_FAILED",
  pic_to_map = "pic-to-map",
  DOCUMENT_CREATED = "DOCUMENT_CREATED",
  DOCUMENT_DELETED = "DOCUMENT_DELETED",
  DOCUMENT_ZIP_START = "DOCUMENT_ZIP_START",
  DOCUMENT_ZIP_COMPLETED = "DOCUMENT_ZIP_COMPLETED",
  DOCUMENT_ZIP_FAILED = "DOCUMENT_ZIP_FAILED",
  REPORT_GENERATION_COMPLETED = "REPORT_GENERATION_COMPLETED",
  REPORT_GENERATION_FAILED = "REPORT_GENERATION_FAILED",
}

enum Mavlink {
  START_STREAM = "START_STREAM",
  END_STREAM = "END_STREAM",
  message = "message",
}

export function Socket(namespace: Namespace, query: Record<string, string> = {}) {
  const queryString = "?"
    + Object.entries(query)
      .map(
        ([key, val]) => `${encodeURIComponent(key)}=${encodeURIComponent(val)}`
      )
      .join("&");
  const socket = io(APP_URL + namespace + queryString);
  return socket;
}

export function CreatedVOD(missionID: string, vodID: string, timeout = 15000) {
  const socket = Socket(Namespace.Mission, { missionID });

  return new Promise<{ _id: string }>((res, rej) => {
    const onSuccess = (vod: any) => {
      if (vod._id === vodID) {
        cleanup();
        res(vod);
      }
    };

    const onFail = (vod: any) => {
      if (vod._id === vodID) {
        cleanup();
        rej(vod);
      }
    };

    const onTimeout = () => {
      cleanup();
      rej(new Error('Timeout waiting for VOD'));
    };

    const cleanup = () => {
      socket.off(Mission.PROCESS_VIDEO_FINISHED, onSuccess);
      socket.off(Mission.REPORT_GENERATION_COMPLETED, onFail);
      socket.disconnect();
    };

    socket.on(Event[Namespace.Mission][0], onSuccess);
    socket.on(Event[Namespace.Mission][1], onFail);
    setTimeout(onTimeout, timeout);
  });
}
