import { CurriedUrl, Login } from "../config/utils";
import request from "supertest";
import app from "../src/app";
import { randomUUID } from "crypto";

let token: string;
beforeAll(async () => (token = await Login()));
const full_url = CurriedUrl("tenant/usergroup");

describe("/usergroup API", () => {
  test("POST /tenant-usergroup-create", async () => {
    const res = await request(app)
      .post(full_url("tenant-usergroup-create"))
      .set("Authorization", `Bearer ${token}`)
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
    await request(app)
      .post(full_url("tenant-usergroup-create"))
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: randomUUID(),
        permissions: ["5f2980678927644fbb2f0a83", "5f29818d8927644fbb2f0a84"], // both exist in db
      })
      .expect(201);
    const res = await request(app)
      .get(full_url("tenant-usergroup-list"))
      .set("Authorization", `Bearer ${token}`)
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
      await request(app)
        .post(full_url("tenant-usergroup-create"))
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: randomUUID(),
          permissions: ["5f2980678927644fbb2f0a83", "5f29818d8927644fbb2f0a84"], // both exist in db
        })
        .expect(201);

      const res2 = await request(app)
        .get(full_url("tenant-usergroup-list"))
        .set("Authorization", `Bearer ${token}`)
        .expect(200);
      created_groups.push(res2.body.data[res2.body.data.length - 1]);
    }
    const res = await request(app)
      .patch(full_url("tenant-usergroup-edit"))
      .set("Authorization", `Bearer ${token}`)
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
      await request(app)
        .post(full_url("tenant-usergroup-create"))
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: randomUUID(),
          permissions: ["5f2980678927644fbb2f0a83", "5f29818d8927644fbb2f0a84"], // both exist in db
        })
        .expect(201);

      const res2 = await request(app)
        .get(full_url("tenant-usergroup-list"))
        .set("Authorization", `Bearer ${token}`)
        .expect(200);
      created_groups.push(res2.body.data[res2.body.data.length - 1]);
    }
    const res = await request(app)
      .delete(full_url("tenant-usergroup-delete"))
      .set("Authorization", `Bearer ${token}`)
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
