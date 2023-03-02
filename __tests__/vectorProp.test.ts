import { CurriedUrl, Login } from "../config/utils";
import request from "supertest";
import app from "../src/app";
import { randomUUID } from "crypto";

let token: string;
beforeAll(async () => (token = await Login()));
const full_url = CurriedUrl("vectorProp");

describe("/vectorProp API", () => {
  test("POST /create", async () => {
    const res = await request(app)
      .post(full_url("create"))
      .set("Authorization", `Bearer ${token}`)
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
    const created_props: any[] = [];
    {
      const res = await request(app)
        .post(full_url("create"))
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: randomUUID(),
          type: "Point",
        })
        .expect(201);
      created_props.push(res.body.data);
    }
    const res = await request(app)
      .get(full_url("get"))
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "vector data fetched successfully",
      data: expect.any(Array),
    });
  });
});
