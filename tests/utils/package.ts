import { SuperAgentTest } from "supertest";
import { CurriedUrl } from "./utils";
import { uploadFile } from "./upload";
import { faker } from "@faker-js/faker";

const full_url = CurriedUrl("admin/package");

export async function createPackage(agent: SuperAgentTest) {
  const fileId = await uploadFile(agent, "./assets/image.png");
  const res = await agent
    .post(full_url("create"))
    .send({
      name: faker.random.alphaNumeric(6),
      bandwidth: faker.random.numeric(3),
      storage: faker.random.numeric(3),
      duration: faker.random.numeric(3),
      userCount: faker.random.numeric(3),
      missionCount: faker.random.numeric(2),
      layerCount: faker.random.numeric(3),
      alertCount: faker.random.numeric(3),
      vodCount: faker.random.numeric(2),
      clientCount: faker.random.numeric(2),
      locationCount: faker.random.numeric(2),
      userGroupCount: faker.random.numeric(2),
      poster: fileId,
    })
    .expect(201);

  expect(res.body).toMatchObject({
    status: true,
    message: expect.any(String),
    data: expect.any(Object),
  });

  return res.body.data;
}
