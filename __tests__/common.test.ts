import { CurriedUrl, Login } from "../config/utils";
import request from "supertest";
import app from "../src/app";

let token: string;
beforeAll(async () => (token = await Login()));
const full_url = CurriedUrl("common");

describe("/common API", () => {
  test("POST /check-email-available", async () => {
    const res = await request(app)
      .post(full_url("check-email-available"))
      .set("Authorization", `Bearer ${token}`)
      .send({
        email: "test" + Math.floor(Math.random() * 100000 + 1) + "@common.com",
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "This email id is available.",
      isAvailable: true,
    });
  });
});
