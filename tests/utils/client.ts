import { SuperAgentTest } from "supertest";
import { CurriedUrl } from "./utils";
import { uploadFile } from "./upload";
import { faker } from "@faker-js/faker";

const full_url = CurriedUrl("client");

export async function createClient(agent: SuperAgentTest) {
  const fileId = await uploadFile(agent, "./assets/userAvatars/NKDA_Logo.png");
  const res = await agent
    .post(full_url("create"))
    .send({
      name: faker.name.fullName(),
      email: faker.internet.email(),
      phoneNo: faker.phone.number("8#########"),
      userGroupId: "6116058af270c9142c1588f2", // !TODO replace with dynamic usergroup
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
      missionId: mission_id, // !TODO replace
      clientId: [client_id],
    })
    .expect(200);

  expect(res.body).toMatchObject({
    status: true,
    message: expect.any(String),
    data: expect.any(Array),
  });
}


