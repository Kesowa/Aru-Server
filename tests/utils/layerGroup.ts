import { SuperAgentTest } from "supertest";
import { CurriedUrl } from "./utils";
import { faker } from "@faker-js/faker";
import { createLayer } from "./layer";

const full_url = CurriedUrl("layergroup");

export async function createLayerGroup(agent: SuperAgentTest, superAdminAgent: SuperAgentTest) {
  const layers = [
    await createLayer(agent, superAdminAgent),
    await createLayer(agent, superAdminAgent),
    await createLayer(agent, superAdminAgent),
  ]
  const res = await agent
    .post(full_url("create"))
    .send({
      name: faker.lorem.words(3),
      type: "Vector",
      layers: layers.map(layer => layer._id),
    })
    .expect(201);

  expect(res.body).toMatchObject({
    status: true,
    message: expect.any(String),
    data: expect.any(Array),
  });
  return res.body.data[0];
}
