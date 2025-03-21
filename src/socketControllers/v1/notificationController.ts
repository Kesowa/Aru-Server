import { Namespace, Socket } from "socket.io";

export const notificationIoController = (io: Namespace) => {
  io.use(joinRoomByTenantID);
};

const joinRoomByTenantID = (socket: Socket, next: (err?: any) => void) => {
  const tenantID = socket.request["session"]?.user?.tenant; if (tenantID) {
    socket.join(tenantID);
    console.log(
      `TenantID : ${tenantID} joined notification Socket with sid: ${socket.id}`,
    );
    next();
  } else {
    console.log(socket.request["session"], "No tenantID passed");
    next(new Error("No tenantID passed"));
  }
  next();
};
