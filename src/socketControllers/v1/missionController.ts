import { Namespace, Socket } from "socket.io";

export const missionIoController = (io: Namespace) => {
  io.use(joinRoomByMissionID);
  io.on("connect", (socket: Socket) => {
    //console.log(socket.rooms);
  });
};

const joinRoomByMissionID = (socket: Socket, next: (err?: any) => void) => {
  const missionID = socket.handshake.query.missionID;
  if (missionID) {
    socket.join(missionID);
    console.log(
      `missionID : ${missionID} joined mission specific Socket with sid: ${socket.id}`
    );
    next();
  } else {
    next(new Error("No missionID passed"));
  }
  next();
};
