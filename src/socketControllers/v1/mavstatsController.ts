import { Namespace, Socket } from "socket.io";
import { addUser, searchUser, SocketUserObject } from "../../utils/socketUtils";
import Asset from "../../models/asset";
import dgram from "dgram";
const server = dgram.createSocket("udp4");
import * as x509 from "@peculiar/x509";
import { Crypto } from "@peculiar/webcrypto";
import webrtc from "wrtc";
// export let stat: mavStat;
import { VODEvents } from "../../utils/videoUtils";
import Flight from "../../models/flight";
import { generateToken } from "../../controllers/v1/streamTokenController";

import format from "date-fns/format";
import { Request } from "express";
import { AuthResponse } from "../../utils/interfaceUtils";
import { getFileSize } from "../../utils/fileUtils";
import { Directory, DirPath } from "../../constants";

const streamers: Array<SocketUserObject> = [];
const Drons: Array<SocketUserObject> = [];
let messg: any;

const senderStreams = new Map<string, any>();
const clientConsumers = new Map<string, any>();
const drones = new Map<string, any>();

const crypto = new Crypto();
x509.cryptoProvider.set(crypto);
// const base64 = await fs.promises.readFile("pem");
// const cert1 = new x509.X509Certificate(base64)
// console.log(cert1)
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
            // let mav = "mavdrone" + String(assetData.tenantID)
            // let peer : any;
            // if(!clientConsumers.get(payload.missionId)) {
            //     peer = await broadcaster(payload.missionId, payload.offer);
            //     await sendAnswer(peer, socket);
            // }

            // const senderStream = senderStreams.get(payload.missionId);

            // if(senderStream){
            //     senderStream.getTracks().forEach((track: any) =>{
            //         peer.addTrack(track, senderStream)
            //     });
            // } else {
            const droneSocket = drones.get(
              assetData.assetInfo[0].UIN.toString()
            );
            if (droneSocket) {
              const p = consumer(
                {
                  missionId: payload.missionId,
                  assetData: assetData,
                },
                droneSocket
              );
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
        // removeUser(streamers,socket.id);
        const assetData = await Asset.findOne({ _id: asset });
        if (assetData) {
          const mav = "mavdrone" + String(assetData.tenantID);
          console.log(mav, assetData.assetInfo[0].UIN, mission);
          clientConsumers.delete(mission);
          // io.to(mav).emit("END_STREAM",(assetData.assetInfo[0].UIN,mission))
        }
        // io.to(socket.handshake.query.tenantId).emit('source',data);
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
  socket: { emit: (arg0: string, arg1: { sdp: any }) => void }
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
  next: (err?: any) => void
) => {
  if (socket.handshake.query.type == "MavDrone") {
    const asset = await Asset.findOne({
      "assetInfo.UIN": socket.handshake.query.UIN,
    });
    const tenantId = asset.tenantID;
    if (tenantId) {
      const mav = "mavdrone" + String(tenantId);
      socket.join(mav);
      addUser(Drons, { id: String(socket.handshake.query.UIN) });
      const UIN: string =
        typeof socket.handshake.query.UIN == "string"
          ? socket.handshake.query.UIN
          : socket.handshake.query.UIN[0];
      drones.set(UIN, socket);
      console.log(
        `Drone connected with UIN:${socket.handshake.query.UIN} and sockedId ${socket.id}`
      );
      next();
    } else {
      console.log(`Tenant verification failed`);
      socket.disconnect();
    }
  } else if (socket.handshake.query.tenantID) {
    const clientEnt = "client" + String(socket.handshake.query.tenantID);
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

const consumer = async (
  payload: { missionId: any; assetData: any },
  socket: {
    emit: (arg0: string, arg1: string) => void;
    on: (arg0: string, arg1: (data: any) => void) => void;
  }
) => {
  const peer = new webrtc.RTCPeerConnection({
    iceServers: [
      {
        urls: "turn:14.97.37.70:3478",
        username: "test",
        credential: "test123",
      },
    ],
  });

  const offer = await peer.createOffer({
    offerToReceiveVideo: true,
    offerToReceiveAudio: true,
  });

  await peer.setLocalDescription(offer);
  console.log(offer);

  const res = {
    offer: offer,
    missionId: payload.missionId,
    assetData: payload.assetData,
  };

  socket.emit("START_STREAM", JSON.stringify(res));

  peer.addEventListener("icegatheringstatechange", function () {
    console.log("hp", peer.iceGatheringState);
  });

  peer.addEventListener("iceconnectionstatechange", function () {
    console.log("as", peer.iceConnectionState);

    if (peer.iceConnectionState === "checking") {
      console.log("It is checking right now");
      peer
        .createOffer({ offerToReceiveVideo: true, offerToReceiveAudio: true })
        .then(
          function (offer: any) {
            //console.log('New offer created: ' + JSON.stringify(offer))
            peer.setLocalDescription(offer);
            socket.emit(
              "START_STREAM",
              JSON.stringify({
                offer: peer.localDescription,
                missionId: payload.missionId,
                assetData: payload.assetData,
              })
            );
          },
          function (err: any) {
            console.log("Error creating new offer");
          }
        );
    }
  });

  peer.addEventListener("signalingstatechange", function () {
    console.log("kp", peer.signalingState);
  });

  socket.on("answer", (data: string) => {
    const descInit = JSON.parse(data) as RTCSessionDescriptionInit;
    console.log(data);
    const desc = new webrtc.RTCSessionDescription(descInit);
    peer.setRemoteDescription(desc).catch((e: any) => console.log(e));
  });

  peer.addEventListener("icegatheringstatechange", function () {
    console.log("hp", peer.iceGatheringState);
  });

  peer.addEventListener("iceconnectionstatechange", function () {
    console.log("as", peer.iceConnectionState);
  });

  peer.addEventListener("signalingstatechange", function () {
    console.log("kp", peer.signalingState);
  });

  peer.ontrack = (e: any) => {
    handleTrackEvent(e, peer, payload.missionId);
  };

  return peer;
};

function handleTrackEvent(e: any, peer: any, missionId: string) {
  console.log(`track handled for missionId : ${missionId}`);
  senderStreams.set(missionId, e.streams[0]);
}

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
      "_id tenant locationID"
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
      tenantID.toString()
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

export const consumerContoller = async (req: Request, res: AuthResponse) => {
  try {
    const peer = new webrtc.RTCPeerConnection({
      iceServers: [
        {
          urls: "turn:14.97.37.70:3478",
          username: "test",
          credential: "test123",
        },
      ],
    });
    const desc = new webrtc.RTCSessionDescription(req.body.sdp);
    await peer.setRemoteDescription(desc);
    const senderStream = senderStreams.get(req.body.missionId);
    if (senderStream == null) {
      console.log(`No mission with missionId ${req.body.missionId}`);
      res.status(404).json({
        message: "No stream found with the supplied missionId",
      });
      return;
    }
    senderStream.getTracks().forEach((track: any) => {
      peer.addTrack(track, senderStream);
    });
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);
    const payload = {
      sdp: peer.localDescription,
    };

    res.json(payload);
  } catch (err) {
    req.log.error(err);
    res.sendStatus(500);
  }
};
