import { CurriedUrl, Login } from "../config/utils";
import request from "supertest";
import app from "../src/app";
import webrtc from "wrtc";

let token: string;
beforeAll(async () => (token = await Login()));
const full_url = CurriedUrl("webrtc");

describe("/webrtc API", () => {
  test("GET /get-active-streams", async () => {
    const res = await request(app)
      .get(full_url("get-active-streams"))
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Sucessfully fetched all active streams",
      data: expect.any(Array),
    });
  });

  test("POST /broadcaster", async () => {
    const fakePeer: RTCPeerConnection = new webrtc.RTCPeerConnection({
      // giving same configuration as the peer in the controller
      iceServers: [
        {
          urls: "turn:14.97.37.70:3478",
          username: "test",
          credential: "test123",
        },
      ],
    });
    const stream = new webrtc.MediaStream();
    stream.getTracks((track) => fakePeer.addTrack(track, stream));
    const offer = await fakePeer.createOffer();
    await fakePeer.setLocalDescription(offer);

    const res = await request(app)
      .post(full_url("broadcaster"))
      .set("Authorization", `Bearer ${token}`)
      .send({
        missionId: "61f3b1e65f915a05cb8885ec", // exists in db
        sdp: offer,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      sdp: expect.any(Object),
    });

    await fakePeer.setRemoteDescription(res.body.sdp);
  });

  test("POST /consumer", async () => {
    const fakePeer: RTCPeerConnection = new webrtc.RTCPeerConnection({
      iceServers: [
        {
          urls: "turn:14.97.37.70:3478",
          username: "test",
          credential: "test123",
        },
      ],
    });
    const offer = await fakePeer.createOffer();
    await fakePeer.setLocalDescription(offer);

    const res = await request(app)
      .post(full_url("consumer"))
      .set("Authorization", `Bearer ${token}`)
      .send({
        missionId: "61f3b1e65f915a05cb8885ec", // exists in db
        sdp: offer,
      })
      .expect(404);

    expect(res.body).toMatchObject({
      message: "No stream found with the supplied missionId",
    });
  });
});
