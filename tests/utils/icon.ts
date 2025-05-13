import { SuperAgentTest } from "supertest";
import { CurriedUrl } from "./utils";
import { uploadFile } from "./upload";
import { faker } from "@faker-js/faker";

const full_url = CurriedUrl("icon");

export async function createIcon(agent: SuperAgentTest) {
  const fileId = await uploadFile(agent, "./assets/icon.png");
  const res = await agent
    .post(full_url("create"))
    .send({
      name: faker.lorem.word({
        length: {
          min: 3,
          max: 32,
        }
      }),
      description: faker.lorem.words(5),
      tags: ["lorem", "ipsum", "dolores"],
      image: fileId,
    })
    .expect(201);

  expect(res.body).toMatchObject({
    status: true,
    message: expect.any(String),
    data: expect.any(Object),
  });

  return res.body.data;
}
