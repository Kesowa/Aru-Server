import { uploadFile } from "./utils/upload";
import { CurriedUrl, Login, Logout } from "./utils/utils";
import { SuperAgentTest } from "supertest";
import { faker } from "@faker-js/faker"; 

let agent: SuperAgentTest;

beforeAll(async () => (agent = await Login()));
afterAll(async () => await Logout(agent));
const full_url = CurriedUrl("common");

describe("/common API", () => {
  test("POST /check-email-available", async () => {
    const res = await agent
      .post(full_url("check-email-available"))
      .send({
        email: faker.internet.email(),
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      isAvailable: true,
    });
  });

  test("POST /upload-url", async () => {
    const uploadId = await uploadFile(agent, "./assets/poles.geojson");

    expect(uploadId).toBeDefined();
  });
});
