import { CurriedUrl, Login } from "../config/utils";
import request from "supertest";
import app from "../src/app";

let token: string;
beforeAll(async () => (token = await Login()));
const full_url = CurriedUrl("pilot");

describe("/pilot API", () => {
  // Endpoint returns no response
  // test("POST /login", async () => {
  //     const res = await request(app)
  //         .post(full_url("login"))
  //         .set("Authorization", `Bearer ${token}`)
  //         .expect(200);
  // });

  test("GET /get-all-pilots", async () => {
    const res = await request(app)
      .get(full_url("get-all-pilots"))
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: expect.any(Array),
    });
  });
});
