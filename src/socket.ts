import { Namespace, Server } from "socket.io";
import alertSocketController from "./socketControllers/v1/alertControllers";
import { droneLocationIoController } from "./socketControllers/v1/droneLocationController";
import { notificationIoController } from "./socketControllers/v1/notificationController";
import { missionIoController } from "./socketControllers/v1/missionController";
import { mavstatIoController } from "./socketControllers/v1/mavstatsController";

export let notificationSocket: Namespace;
export let missionSpecificSocket: Namespace;
export const ioHandler = (io: Server) => {
  //to stream drone location
  const droneLocationStreamingIo = io.of("/stream/dronelocation");
  droneLocationIoController(droneLocationStreamingIo);

  const alertStreamIo = io.of("/stream/alert");
  alertSocketController(alertStreamIo);

  const notificationIo = io.of("/stream/notification");
  notificationSocket = notificationIo;
  notificationIoController(notificationIo);

  const missionIo = io.of("/stream/mission-specific");
  missionSpecificSocket = missionIo;
  missionIoController(missionIo);

  const mavlinkStatIo = io.of("/stream/mavStats");
  mavstatIoController(mavlinkStatIo);
};
