import request, { SuperAgentTest } from "supertest";
import { APP_URL, CurriedUrl } from "./utils";
import { uploadFile } from "./upload";
import { faker } from "@faker-js/faker";
import { createUsergroup } from "./usergroup";
import { TENANT_CLIENT_PERMS } from "./permission";
import { createMission } from "./mission";

const full_url = CurriedUrl("client");

export async function createClient(agent: SuperAgentTest) {
  const fileId = await uploadFile(agent, "./assets/userAvatars/NKDA_Logo.png");
  const usergroup = await createUsergroup(agent, undefined, [...TENANT_CLIENT_PERMS]);
  const res = await agent
    .post(full_url("create"))
    .send({
      name: faker.name.fullName(),
      email: faker.internet.email(),
      phoneNo: faker.phone.number("8#########"),
      userGroupId: usergroup._id,
      userType: "tenant-client",
      country: "India",
      city: "Kolkata",
      expiryDate: faker.date.future().toISOString().split("T")[0],
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

export async function addClientToMission(agent: SuperAgentTest, client_id: string, mission_id: string) {
  const res = await agent
    .patch(full_url("insert-client-for-mission"))
    .send({
      missionId: mission_id,
      clientId: [client_id],
    })
    .expect(200);

  expect(res.body).toMatchObject({
    status: true,
    message: expect.any(String),
    data: expect.any(Array),
  });
}

export async function CreateAndLoginClient(agent: SuperAgentTest, superAdminAgent: SuperAgentTest) {
  const client = await createClient(agent);
  const newPassword = faker.internet.password();
  await agent
    .patch(full_url("edit-client-details"))
    .send({
      id: client._id,
      password: newPassword,
    })
    .expect(200);
  const { mission } = await createMission(agent, superAdminAgent);
  await addClientToMission(agent, client._id, mission._id);

  const clientAgent = request.agent(APP_URL);

  await clientAgent
    .post(CurriedUrl("auth")("login"))
    .send({
      email: client.email,
      password: newPassword,
    })
    .expect(200);

  return { client, clientAgent };
}
