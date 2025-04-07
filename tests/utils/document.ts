import { SuperAgentTest } from "supertest";
import { CurriedUrl } from "./utils";
import { uploadFile } from "./upload";
import { createMission } from "./mission";

const full_url = CurriedUrl("document");

export async function createDocument(agent: SuperAgentTest, superAdminAgent: SuperAgentTest) {
  const { mission } = await createMission(agent, superAdminAgent);
  const fileId = await uploadFile(agent, "./assets/image.png");
  const res = await agent
    .post(full_url("create"))
    .send({
      missionId: mission._id,
      folderName: "rawPhotos",
      type: "image/png",
      file: fileId,
    })
    .expect(201);

  expect(res.body).toMatchObject({
    status: true,
    message: expect.any(String),
    data: expect.any(Object),
  });

  return res.body.data;
}
