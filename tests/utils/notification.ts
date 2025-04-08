import { io, Socket } from "socket.io-client";
import { APP_URL } from "./utils";
import { setInterval } from "timers/promises";

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
  ASSIGNED = "ASSIGNED SUCESSFULLY",
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

function NewSocket(namespace: Namespace, query: Record<string, string> = {}) {
  const queryString = "?"
    + Object.entries(query)
      .map(
        ([key, val]) => `${encodeURIComponent(key)}=${encodeURIComponent(val)}`
      )
      .join("&");
  const socket = io(APP_URL + namespace + queryString);
  return socket;
}

function WaitNotify(socket: Socket,) {
  const events: { event: any; arg: any[]; }[] = [];
  socket.onAny((event, ...args) => {
    events.push({ event, arg: args[0] });
  })
  return async (predicate: (event: any, arg: any) => boolean, timeout = 15000) => {
    let count = timeout / 1000;
    for await (const _ of setInterval(1000)) {
      count--;
      if (count < 0) {
        socket.offAny();
        socket.disconnect();
        throw new Error("Timeout waiting for event");
      }
      const index = events.findIndex(val => predicate(val.event, val.arg));
      if (index > -1) {
        socket.offAny();
        socket.disconnect();
        return events[index];
      }
    }
  };
}

export function CreatedVOD(missionID: string) {
  const socket = NewSocket(Namespace.Mission, { missionID });
  const waiter = WaitNotify(socket);
  return async (vodID: string, timeout = 15000) => await waiter((event, arg) => event == Mission.PROCESS_VIDEO_FINISHED && arg._id == vodID, timeout);
}
