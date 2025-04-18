import { SuperAgentTest } from "supertest";
import { CurriedUrl } from "./utils";
import { uploadFile } from "./upload";
import { faker } from "@faker-js/faker";
import { createUsergroup } from "./usergroup";

const full_url = CurriedUrl("tenant/user");

export async function createUser(agent: SuperAgentTest, usergroupName?: string) {
  const fileId = await uploadFile(agent, "./assets/image.png");
  const usergroup = await createUsergroup(agent, usergroupName);
  const res = await agent
    .post(full_url("create-tenant-user"))
    .send({
      name: faker.name.fullName(),
      phoneNo: faker.phone.number("8#########"),
      email: faker.internet.email(),
      userGroupId: usergroup._id,
      dob: (new Date()).toISOString(),
      aadhaarNo: faker.random.numeric(12),
      pilotLicenceNo: faker.random.numeric(6),
      avatar: fileId,
    })
    .expect(201);

  expect(res.body).toMatchObject({
    status: true,
    message: expect.any(String),
    data: expect.any(Object),
  });

  return res.body.data;
}
