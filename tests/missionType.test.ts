import { CurriedUrl, Login, LoginSuper, Logout} from "./utils/utils";
import {SuperAgentTest} from "supertest";
import { randomUUID } from "crypto";

let agent: SuperAgentTest;

beforeAll(async () => (agent = await LoginSuper()));
afterAll(async () => Logout(agent));
const full_url = CurriedUrl("common/missiontype");

describe("/common/missiontype API", () => {
  test("POST /create", async () => {
    const res = await agent
      .post(full_url("create"))
      .send({
        name: randomUUID(),
        description: randomUUID(),
      })
      .expect(201);

    expect(res.body).toMatchObject({
      status: true,
      message: "mission type created.",
      data: expect.any(Object),
    });
  });

  test("GET /getall", async () => {
    await agent
      .post(full_url("create"))
      .send({
        name: randomUUID(),
        description: randomUUID(),
      })
      .expect(201);
    const res = await agent
      .get(full_url("getall"))
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Missions fetched sucessfully.",
      data: expect.any(Array),
    });
  });

  test("POST /edit", async () => {
    const created_types: any[] = [];
    {
      const res = await agent
        .post(full_url("create"))
        .send({
          name: randomUUID(),
          description: randomUUID(),
        })
        .expect(201);
      created_types.push(res.body.data);
    }
    const res = await agent
      .post(full_url("edit"))
      .send({
        _id: created_types[0]._id,
        name: randomUUID(),
        description: randomUUID(),
        isActive: "true",
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "mission type editted",
      data: expect.any(Object),
    });
  });

  test("POST /delete", async () => {
    const created_types: any[] = [];
    {
      const res = await agent
        .post(full_url("create"))
        .send({
          name: randomUUID(),
          description: randomUUID(),
        })
        .expect(201);
      created_types.push(res.body.data);
    }
    const res = await agent
      .post(full_url("delete"))
      .send({
        _id: created_types[0]._id,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "mission type deleted",
    });
  });
});
