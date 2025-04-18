import { SuperAgentTest } from "supertest";
import { CurriedUrl } from "./utils";
import { faker } from "@faker-js/faker";

const full_url = CurriedUrl("common/missiontype");

export async function createMissionType(agent: SuperAgentTest) {
  const res = await agent
    .post(full_url("create"))
    .send({
        name: faker.random.words(2),
        description: faker.random.words(3),
    })
    .expect(201);

  expect(res.body).toMatchObject({
    status: true,
    message: expect.any(String),
    data: expect.any(Object),
  });

  return res.body.data;
}
