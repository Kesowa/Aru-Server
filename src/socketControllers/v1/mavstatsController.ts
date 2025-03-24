import dgram from "dgram";

import { Namespace, Socket } from "socket.io";

import { Directory, DirPath } from "../../constants";
import Asset from "../../models/asset";
import { getFileSize } from "../../utils/fileUtils";
import { addUser, searchUser, SocketUserObject } from "../../utils/socketUtils";
const server = dgram.createSocket("udp4");
import { VODEvents } from "../../utils/videoUtils";
import Flight from "../../models/flight";
import { generateToken } from "../../controllers/v1/streamTokenController";

import format from "date-fns/format";

const streamers: Array<SocketUserObject> = [];
const Drons: Array<SocketUserObject> = [];
let messg: any;

// const senderStreams = new Map<string, any>();
// const clientConsumers = new Map<string, any>();
const drones = new Map<string, any>();

export const mavstatIoController = async (io: Namespace) => {
  io.use(Auth);
  // io.set()
  io.use(joinRoomByStreamKey);
  io.on("connect", (socket) => {
    socket
      .on("START_STREAM", async (payload) => {
        if (searchUser(streamers, socket.id)) {
          const assetData = await Asset.findOne({ _id: payload.assetId });
          if (assetData) {
            const droneSocket = drones.get(
              assetData.assetInfo[0].UIN.toString(),
            );
            if (droneSocket) {
              // }
            }
          }
        }
      })
      .on("message", (msg, rinfo) => {
        messg = msg;
        const clientEnt = "client" + String(socket.handshake.query.tenantID);
        socket.to(clientEnt).emit("message", messg);
        console.log(`server got: ${msg} from ${rinfo.address}:${rinfo.port}`);
      });
    socket.on("END_STREAM", async (mission, asset) => {
      if (searchUser(streamers, socket.id)) {
        const assetData = await Asset.findOne({ _id: asset });
        if (assetData) {
          const mav = "mavdrone" + String(assetData.tenantID);
          console.log(mav, assetData.assetInfo[0].UIN, mission);
          // clientConsumers.delete(mission);
        }
      }
    });

    socket.on("START_FILE_SYNC", async (data) => {
      const assetData = await Asset.findOne({ _id: data.assetId });
      const droneSocket = drones.get(assetData.assetInfo[0].UIN.toString());

      if (droneSocket) {
        droneSocket.emit("START_FILE_SYNC", {
          missionId: data.missionId,
        });

        droneSocket.on("file_uploaded", async (data: any) => {
          await processVideo(data);
        });
      } else {
        console.log("Drone is not live");
      }
    });
  });
};

const sendAnswer = async (
  peer: {
    createAnswer: () => any;
    setLocalDescription: (arg0: any) => any;
    localDescription: any;
  },
  socket: { emit: (arg0: string, arg1: { sdp: any }) => void },
) => {
  const answer = await peer.createAnswer();
  await peer.setLocalDescription(answer);
  const payload = {
    sdp: peer.localDescription,
  };
  socket.emit("ANSWER", payload);
};

const Auth = async (socket: Socket, next: Function) => {
  console.log("UIN is....." + socket.handshake.query.UIN);
  if (socket.handshake.query.UIN) {
    const asset = await Asset.findOne({
      "assetInfo.UIN": socket.handshake.query.UIN,
    });
    const UIN: string =
      typeof socket.handshake.query.UIN == "string"
        ? socket.handshake.query.UIN
        : socket.handshake.query.UIN[0];
    drones.set(UIN, socket);
    console.log(asset);
    if (asset) {
      console.log("ohhhhh Drone connected!");
      return next();
    } else {
      return next(new Error("asset does not exist!"));
    }
  } else if (socket.handshake.query.tenantID) {
    console.log(socket.handshake.query.tenantID);
    return next();
  } else {
    next(new Error("Auth failed"));
  }
};

const joinRoomByStreamKey = async (
  socket: Socket,
  next: (err?: any) => void,
) => {
  const tenantID = socket.request["session"]?.user?.tenant;
  if (!tenantID) {
    next(new Error("user not authenticated"));
    return
  }
  if (socket.handshake.query.type == "MavDrone") {
    const mav = "mavdrone" + String(tenantID);
    socket.join(mav);
    addUser(Drons, { id: String(socket.handshake.query.UIN) });
    const UIN: string =
      typeof socket.handshake.query.UIN == "string"
        ? socket.handshake.query.UIN
        : socket.handshake.query.UIN[0];
    drones.set(UIN, socket);
    console.log(
      `Drone connected with UIN:${socket.handshake.query.UIN} and sockedId ${socket.id}`,
    );
    next();
  } else if (socket.handshake.query.tenantID) {
    const clientEnt = "client" + String(tenantID);
    socket.join(clientEnt);
    addUser(streamers, { id: socket.id });
    console.log("oiiiiiiii room connected");
    next();
  } else {
    next(new Error("No tenant Id passed"));
  }
};

// const broadcaster = async (missionId, offer) => {
//     try {
//         const peer : RTCPeerConnection = new webrtc.RTCPeerConnection({
//             iceServers: [
//                 {
//                     urls: "turn:14.97.37.70:3478",
//                     username : "test",
//                     credential : "test123"
//                 }
//             ]
//         });

//         peer.addEventListener("connectionstatechange",() => {
//             if(peer.connectionState === "disconnected"){
//                 senderStreams.delete(missionId)
//             }
//         })

//         // peer.ontrack = (e:any) => handleTrackEvent(e, peer,missionId);
//         const desc = new webrtc.RTCSessionDescription(offer);
//         await peer.setRemoteDescription(desc);

//         peer.addEventListener('icegatheringstatechange', function() {
//             console.log("chp", peer.iceGatheringState);
//         })

//         peer.addEventListener('iceconnectionstatechange', function() {
//             console.log("cas", peer.iceConnectionState)
//         });

//         peer.addEventListener('signalingstatechange', function() {
//             console.log("ckp", peer.signalingState);
//         });

//         return peer;
//     } catch (error) {
//         console.error(error)
//     }
// }

// function handleTrackEvent(e: any, peer: any, missionId: string) {
//   console.log(`track handled for missionId : ${missionId}`);
//   senderStreams.set(missionId, e.streams[0]);
// }

server.on("error", (err) => {
  console.log(`server error:\n${err.stack}`);
  server.close();
});

server.on("listening", () => {
  const address = server.address();
  console.log(`server listening ${address.address}:${address.port}`);
});

//server.bind(41234);

const processVideo = async (data: {
  missionId: any;
  file: string;
  missionID: string;
}) => {
  try {
    console.log(data);
    const flight = await Flight.findOne({ mission: data.missionId }).select(
      "_id tenant locationID",
    );
    const flightID = flight._id;
    const tenantID = flight.tenant;
    const locationID = flight.locationID;
    const fullPath = DirPath(Directory.TEMP, data.file);
    const missionID = data.missionId;
    const fullPath2 = DirPath(Directory.VOD);
    const token = generateToken(
      data.missionID,
      flightID.toString(),
      locationID.toString(),
      tenantID.toString(),
    );
    const timestamp = format(new Date(), "dd-MMM-yy-hh-mm-ss");
    const filename = `${token}-${timestamp}`;
    const originalName = data.file;
    const size = await getFileSize(DirPath(Directory.TEMP, data.file));

    VODEvents.emit("PROCESS_VIDEO", {
      missionID,
      flightID,
      fullPath2,
      locationID,
      fullPath,
      filename,
      tenantID,
      originalName,
      size,
    });
  } catch (error) {
    console.error(error);
  }
};
