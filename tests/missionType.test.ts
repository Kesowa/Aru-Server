import { CurriedUrl, LoginSuper, Logout} from "./utils/utils";
import {SuperAgentTest} from "supertest";
import { createMissionType } from "./utils/missionType";
import { faker } from "@faker-js/faker";

let agent: SuperAgentTest;

beforeAll(async () => (agent = await LoginSuper()));
afterAll(async () => await Logout(agent));
const full_url = CurriedUrl("common/missiontype");

describe("/common/missiontype API", () => {
  test("POST /create", async () => {
    await createMissionType(agent);
  });

  test("GET /getall", async () => {
    await createMissionType(agent);

    const res = await agent
      .get(full_url("getall"))
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: expect.any(Array),
    });
  });

  test("POST /edit", async () => {
    const missionType = await createMissionType(agent);

    const res = await agent
      .post(full_url("edit"))
      .send({
        _id: missionType._id,
        name: faker.random.words(2),
        description: faker.random.words(3),
        isActive: "true",
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: expect.any(Object),
    });
  });

  test("POST /delete", async () => {
    const missionType = await createMissionType(agent);

    const res = await agent
      .post(full_url("delete"))
      .send({
        _id: missionType._id,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
    });
  });
});
