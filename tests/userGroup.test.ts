import { CurriedUrl, Login, Logout } from "./utils/utils";
import {SuperAgentTest} from "supertest";
import { randomUUID } from "crypto";

let agent: SuperAgentTest;

beforeAll(async () => (agent = await Login()));
afterAll(async () => Logout(agent));
const full_url = CurriedUrl("tenant/usergroup");

describe("/usergroup API", () => {
  test("POST /tenant-usergroup-create", async () => {
    const res = await agent
      .post(full_url("tenant-usergroup-create"))
      .send({
        name: randomUUID(),
        permissions: ["5f2980678927644fbb2f0a83", "5f29818d8927644fbb2f0a84"], // both exist in db
      })
      .expect(201);

    expect(res.body).toMatchObject({
      status: true,
      message: "User Group created sucessfully",
    });
  });

  test("GET /tenant-usergroup-list", async () => {
    await agent
      .post(full_url("tenant-usergroup-create"))
      .send({
        name: randomUUID(),
        permissions: ["5f2980678927644fbb2f0a83", "5f29818d8927644fbb2f0a84"], // both exist in db
      })
      .expect(201);
    const res = await agent
      .get(full_url("tenant-usergroup-list"))
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "user groups fetched",
      data: expect.any(Array),
    });
  });

  test("PATCH /tenant-usergroup-edit", async () => {
    const created_groups: any[] = [];
    {
      await agent
        .post(full_url("tenant-usergroup-create"))
        .send({
          name: randomUUID(),
          permissions: ["5f2980678927644fbb2f0a83", "5f29818d8927644fbb2f0a84"], // both exist in db
        })
        .expect(201);

      const res2 = await agent
        .get(full_url("tenant-usergroup-list"))
        .expect(200);
      created_groups.push(res2.body.data[res2.body.data.length - 1]);
    }
    const res = await agent
      .patch(full_url("tenant-usergroup-edit"))
      .send({
        id: created_groups[0]._id,
        name: randomUUID(),
        permissions: ["5f2980678927644fbb2f0a83"], // exists in db
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "User group successfully updated!",
      data: expect.any(Object),
    });
  });

  test("DELETE /tenant-usergroup-delete", async () => {
    const created_groups: any[] = [];
    {
      await agent
        .post(full_url("tenant-usergroup-create"))
        .send({
          name: randomUUID(),
          permissions: ["5f2980678927644fbb2f0a83", "5f29818d8927644fbb2f0a84"], // both exist in db
        })
        .expect(201);

      const res2 = await agent
        .get(full_url("tenant-usergroup-list"))
        .expect(200);
      created_groups.push(res2.body.data[res2.body.data.length - 1]);
    }
    const res = await agent
      .delete(full_url("tenant-usergroup-delete"))
      .query({
        id: created_groups[0]._id,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "User Group deleted successfully!",
    });
  });
});
