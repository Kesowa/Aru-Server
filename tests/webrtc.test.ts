import { CurriedUrl, Login, LoginSuper, Logout } from "./utils/utils";
import {SuperAgentTest} from "supertest";
import webrtc from "wrtc";
import { createMission } from "./utils/mission";

let agent: SuperAgentTest;
let superAdminAgent: SuperAgentTest;
beforeAll(async () => {
  agent = await Login();
  superAdminAgent = await LoginSuper();
});
afterAll(async () => {
  await Logout(agent);
  await Logout(superAdminAgent);
});
const full_url = CurriedUrl("webrtc");

describe("/webrtc API", () => {
  test("GET /get-active-streams", async () => {
    const res = await agent
      .get(full_url("get-active-streams"))
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: expect.any(Array),
    });
  });

  test("POST /broadcaster", async () => {
    const fakePeer: webrtc.RTCPeerConnection = new webrtc.RTCPeerConnection({
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
    stream.getTracks().forEach((track) => fakePeer.addTrack(track, stream));
    const offer = await fakePeer.createOffer();
    await fakePeer.setLocalDescription(offer);

    const { mission } = await createMission(agent, superAdminAgent);

    const res = await agent
      .post(full_url("broadcaster"))
      .send({
        missionId: mission._id,
        sdp: offer,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      sdp: expect.any(Object),
    });

    await fakePeer.setRemoteDescription(res.body.sdp);
  });

  test("POST /consumer", async () => {
    const fakePeer: webrtc.RTCPeerConnection = new webrtc.RTCPeerConnection({
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

    const { mission } = await createMission(agent, superAdminAgent);

    const res = await agent
      .post(full_url("consumer"))
      .send({
        missionId: mission._id,
        sdp: offer,
      })
      .expect(404);

    expect(res.body).toMatchObject({
      message: expect.any(String),
    });
  });
});
