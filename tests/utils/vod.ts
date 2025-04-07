import { SuperAgentTest } from "supertest";
import { CurriedUrl } from "./utils";
import { uploadFile } from "./upload";
import { createMission } from "./mission";
import { createLocation } from "./location";
import { Mongoose, Types } from "mongoose";

const full_url = CurriedUrl("VOD");

export async function createVOD(agent: SuperAgentTest, superAdminAgent: SuperAgentTest, mongoClient: Mongoose) {
  const { mission, flight } = await createMission(agent, superAdminAgent);
  const location = await createLocation(agent);
  const fileId = await uploadFile(agent, "./assets/video.mp4");
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

  const vodId = new Types.ObjectId(res.body.data._id);
  let isProcessed = false;
  let processedVOD: any;

  while(!isProcessed) {
    processedVOD = await mongoClient.connection.collection('vods').findOne({ _id: vodId });
    expect(processedVOD).toBeTruthy();
    isProcessed = (processedVOD?.thumbnail !== "/processing.png");
    await new Promise(r => setTimeout(r, 1000)); // 1 second wait before re-checking
  }

  expect(isProcessed).toBe(true);

  return processedVOD;
}
