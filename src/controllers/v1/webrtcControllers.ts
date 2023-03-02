import webrtc from "wrtc";
import { AuthResponse } from "./../../utils/interfaceUtils";
import { Request } from "express";

const senderStreams = new Map<string, any>();

export const broadcasterController = async (
  req: Request,
  res: AuthResponse
) => {
  {
    // const missionExist = await missionModel.findById(req.body.missionId);
    // if ( missionExist === null ){
    //     res.status(400).json({
    //         status : false,
    //         message : "Invalid Mission Id"
    //     })
    //     return;
    // }
    const peer = new webrtc.RTCPeerConnection({
      iceServers: [
        {
          urls: "turn:14.97.37.70:3478",
          username: "test",
          credential: "test123",
        },
      ],
    });
    peer.addEventListener("connectionstatechange", () => {
      if (peer.connectionState === "disconnected") {
        senderStreams.delete(req.body.missionId);
      }
    });
    peer.ontrack = ({ streams }) =>
      senderStreams.set(req.body.missionId, streams[0]);
    const desc = new webrtc.RTCSessionDescription(req.body.sdp);
    await peer.setRemoteDescription(desc);
    const answer = await peer.createAnswer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    });
    await peer.setLocalDescription(answer);
    const payload = {
      sdp: peer.localDescription,
    };
    res.json(payload);
  }
};

export const consumerContoller = async (req: Request, res: AuthResponse) => {
  {
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
  }
};

export const getActiveStreams = (req: Request, res: AuthResponse) => {
  const activeStreams = new Array<string>();
  for (const missionId of Array.from(senderStreams.keys())) {
    activeStreams.push(missionId);
  }
  res.json({
    status: true,
    message: "Sucessfully fetched all active streams",
    data: activeStreams,
  });
};

function handleTrackEvent(e: any, peer: any, missionId: string) {
  console.log(`track handled for missionId : ${missionId}`);
  senderStreams.set(missionId, e.streams[0]);
}
