import { CurriedUrl, Login, Logout } from "./utils/utils";
import {SuperAgentTest} from "supertest";
import { randomUUID } from "crypto";

let agent: SuperAgentTest;

beforeAll(async () => (agent = await Login()));
afterAll(async () => await Logout(agent));
const full_url = CurriedUrl("vectorProp");

describe("/vectorProp API", () => {
  test("POST /create", async () => {
    const res = await agent
      .post(full_url("create"))
      .send({
        name: randomUUID(),
        type: "Point",
      })
      .expect(201);

    expect(res.body).toMatchObject({
      status: true,
      message: "New vectorProps created",
      data: expect.any(Object),
    });
  });

  test("GET /get", async () => {
    await agent
      .post(full_url("create"))
      .send({
        name: randomUUID(),
        type: "Point",
      })
      .expect(201);
    const res = await agent
      .get(full_url("get"))
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "vector data fetched successfully",
      data: expect.any(Array),
    });
  });
});
