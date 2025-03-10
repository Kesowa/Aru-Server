import { CurriedUrl, LoginSuper } from "../config/utils";
import request from "supertest";
import app from "../src/app";
import { randomUUID } from "crypto";

let token: string;
beforeAll(async () => (token = await LoginSuper()));
const full_url = CurriedUrl("common/missiontype");

describe("/common/missiontype API", () => {
  test("POST /create", async () => {
    const res = await request(app)
      .post(full_url("create"))
      .set("Authorization", `Bearer ${token}`)
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
    await request(app)
      .post(full_url("create"))
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: randomUUID(),
        description: randomUUID(),
      })
      .expect(201);
    const res = await request(app)
      .get(full_url("getall"))
      .set("Authorization", `Bearer ${token}`)
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
      const res = await request(app)
        .post(full_url("create"))
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: randomUUID(),
          description: randomUUID(),
        })
        .expect(201);
      created_types.push(res.body.data);
    }
    const res = await request(app)
      .post(full_url("edit"))
      .set("Authorization", `Bearer ${token}`)
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
      const res = await request(app)
        .post(full_url("create"))
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: randomUUID(),
          description: randomUUID(),
        })
        .expect(201);
      created_types.push(res.body.data);
    }
    const res = await request(app)
      .post(full_url("delete"))
      .set("Authorization", `Bearer ${token}`)
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
