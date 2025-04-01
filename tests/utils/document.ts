import { SuperAgentTest } from "supertest";
import { CurriedUrl } from "./utils";
import { uploadFile } from "./upload";

const full_url = CurriedUrl("document");

export async function createDocument(agent: SuperAgentTest) {
  const fileId = await uploadFile(agent, "./assets/image.png");
  const res = await agent
    .post(full_url("create"))
    .send({
      missionId: "61f3b1e65f915a05cb8885ec", // !TODO replace
      "folderName": "rawPhotos",
      "type": "image/png",
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
