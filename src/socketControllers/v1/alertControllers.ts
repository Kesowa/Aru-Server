import { randomUUID } from "crypto";

import axios from "axios";
import { Types } from "mongoose";
import { Namespace, Socket } from "socket.io";

import { logger } from "../../app";
import { ARU_INSTANCE, Directory, Instance, MAP_KEY } from "../../constants";
import Alert from "../../models/alert";
import Tenant from "../../models/tenant";
import { IPackage } from "../../schemas/package";
import { notificationSocket } from "../../socket";
import { saveFile } from "../../utils/dataUtils";
import { AIRequest } from "../../utils/socketUtils";
import { WiproInterface } from "../../utils/wipro";
import { stat } from "../v1/droneLocationController";

const geoMapApi = "https://maps.googleapis.com/maps/api/geocode/json";

/*
 * After a client connects to /stream/alert Namespace,
 * joinRoomByType  middleware assign rooms to the socket based on query.type parameter
 * if parameter is AI_SERVER socket joins AI_ROOM else it joins the CLIENT_ROOM
 */

const alertSocketController = (alertSocket: Namespace) => {
  alertSocket.use(joinRoomByType);

  alertSocket.on("connect", (socket: Socket) => {
    /*
     * When the server Recieves an START_AI event on the socket,
     * it emits a `AI_WORK_START` event on the AI_ROOM along with an object
     * containing work details like streamKey,MissionId,...
     * and also the socket id of the socket initiating the work.
     */

    socket.on("AI_START", (data: AIRequest) => {
      data.threshold = 5;
      console.log(`Start event Received`);
      socket
        .to("AI_ROOM")
        .emit("AI_WORK_START", socket.id, JSON.stringify(data));
      console.log("Start Emitted to room");
    });

    /*
     * When the server Receives an STOP_AI event
     * it emits as `AI_WORK_STOP` event to the AI_ROOM along with an object
     * of type AIRequest and also the socket id of the
     */

    socket.on("AI_STOP", (data: AIRequest) => {
      socket
        .to("AI_ROOM")
        .emit("AI_WORK_STOP", socket.id, JSON.stringify(data));
      console.log("Stopped Emitted to room");
    });

    /*
     * After AI got some inference it will send the AI_INFERED event,
     * The socket Server will save the data using Alert model to the database
     * Then the socket Server will emit an event to the client socket
     * who initailly Started the server using START_AI
     */

    socket.on("ALERT", async (data: any) => {
      const converted = Buffer.from(data.image, "base64");
      try {
        const name = randomUUID() + ".png";
        const details = await saveFile(Directory.ALERT_IMAGES, name, converted);

        const docCount = await Tenant.findOne({ _id: data.tenantId })
          .populate<{ activePackage: IPackage }>("activePackage")
          .lean();

        const mapResponse = await axios.get(geoMapApi, {
          params: {
            latlng: `${stat.location.lat},${stat.location.long}`,
            key: MAP_KEY,
          },
        });
        data.location = { long: stat.location.long, lat: stat.location.lat };
        data.image = details.filepath;
        data.locationName = mapResponse?.data?.results[0]?.formatted_address;
        data.createdBy = new Types.ObjectId("6099204ee930187488a1487b");
        data.onSite = true;
        data.note = "Alert captured using net!";
        const alert = new Alert({ ...data });
        if (
          Number(docCount.actualAlertCount) <
          Number(docCount.activePackage.alertCount)
        ) {
          if (
            Number(docCount.actualSize) +
              Number(details.size / (1024 * 1024)) <=
            Number(docCount.activePackage.storage)
          ) {
            alert
              .create()
              .then(async (d) => {
                console.log(`Alert saved with ${d._id}`);
                // #region WIPRO
                if (ARU_INSTANCE == Instance.NKDA) {
                  await WiproInterface.SendAlert(
                    alert,
                    socket.client.conn.remoteAddress,
                    logger,
                  );
                }
                // #endregion
                notificationSocket
                  .to(data.tenantId)
                  .emit("ALERT_CREATED", data);
              })
              .catch((err) => {
                console.error(err);
              });
          } else {
            notificationSocket.to(data.tenantId).emit("ALERT_CREATED", {
              message: new Error(
                "Actual size exceeded the Limit of Set storage!",
              ),
            });
          }
        } else {
          notificationSocket.to(data.tenantId).emit("ALERT_CREATED", {
            message: new Error(
              "Actual alertCount exceeded the Limit of Set alertCount!",
            ),
          });
        }
      } catch (error) {
        console.error(error);
      }
    });

    socket.on("AIWES_ACK", (socketID: string) => {
      alertSocket.to(socketID).emit("ACK_AI_START", { message: "AI started" });
      console.log(`ACK_AI_START event sent to ${socketID}`);
    });

    socket.on("AIWESt_ACK", (socketID: string) => {
      alertSocket.to(socketID).emit("ACK_AI_STOP", { message: "AI stopped b" });
      console.log(`ACK_AI_STOP event sent to ${socketID}`);
    });
  });
};

const joinRoomByType = (socket: Socket, next: (err?: any) => void) => {
  const tenantID = socket.request["session"]?.user?.tenant;
  if (!tenantID) {
    next(new Error("user not authenticated"));
    return
  }
  if (socket.handshake.query && socket.handshake.query.type == "AI_SERVER") {
    console.log(`AI Registered with ${socket.id}`);
    socket.join(`${tenantID}-AI_ROOM`);
  } else {
    socket.join(`${tenantID}-CLIENT_ROOM`);
    console.log(`CLIENT Registered with ${socket.id}`);
  }
  next();
};

export default alertSocketController;
