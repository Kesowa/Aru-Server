import { SuperAgentTest } from "supertest";
import { CurriedUrl } from "./utils";
import { PERMS } from "./permission";
import { faker } from "@faker-js/faker";

const full_url = CurriedUrl("tenant/usergroup");

export async function createUsergroup(agent: SuperAgentTest, name?: string) {
  const res = await agent
    .post(full_url("tenant-usergroup-create"))
    .send({
        name: name ?? faker.random.alphaNumeric(6),
        permissions: [PERMS.MISSION_LIST, PERMS.MISSION_UPDATE],
    })
    .expect(201);

  expect(res.body).toMatchObject({
    status: true,
    message: expect.any(String),
    data: expect.any(Object),
  });

  return res.body.data;
}
