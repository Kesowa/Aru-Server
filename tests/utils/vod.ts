import { SuperAgentTest } from "supertest";
import { CurriedUrl } from "./utils";
import { uploadFile } from "./upload";
import { createMission } from "./mission";
import { createLocation } from "./location";
import { CreatedVOD } from "./notification";

const full_url = CurriedUrl("VOD");

export async function createVOD(agent: SuperAgentTest, superAdminAgent: SuperAgentTest) {
  const { mission, flight } = await createMission(agent, superAdminAgent);
  const location = await createLocation(agent);
  const fileId = await uploadFile(agent, "./assets/video.mp4");
  const notifier = CreatedVOD(mission._id);
  const res = await agent
    .post(full_url("save-vod-manual"))
    .send({
      file: fileId,
      locationID: location._id,
      missionID: mission._id,
      flightID: flight._id,
    })
    .expect(200);

  expect(res.body).toMatchObject({
    status: true,
    message: expect.any(String),
    data: expect.any(Object),
  });

  const vodNotification = await notifier(res.body.data._id, 30000);

  expect(vodNotification).toBeDefined();

  return vodNotification?.arg;
}

export async function createVODStreamKey(agent: SuperAgentTest, superAdminAgent: SuperAgentTest) {
  const { mission, flight } = await createMission(agent, superAdminAgent);
  const location = await createLocation(agent);

  // missionID, flightID, locationID, tenantId
  const metadata = [ mission._id, flight._id, location._id, mission.tenantId ];
  const videoMetadata = Buffer.from(metadata.join("-")).toString("base64");
  const filename = videoMetadata + "-video.mp4";

  const fileId = await uploadFile(agent, "./assets/video.mp4", filename);
  const notifier = CreatedVOD(mission._id);
  const res = await agent
    .post(full_url("save-VOD"))
    .send({
      file: fileId,
    })
    .expect(200);

  expect(res.body).toMatchObject({
    status: true,
    message: expect.any(String),
    data: expect.any(Object),
  });

  const vodNotification = await notifier(res.body.data._id, 30000);

  expect(vodNotification).toBeDefined();

  return vodNotification?.arg;
}