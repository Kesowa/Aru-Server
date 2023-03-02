import app from "../src/app";
import request from "supertest";
import { CurriedUrl } from "../config/utils";

const full_url = CurriedUrl("auth");
describe("/auth API", () => {
  test("/login", async () => {
    const res = await request(app)
      .post(full_url("login"))
      .send({
        email: "admin@NKDA.com",
        password: "fsipl1@3$",
      })
      .expect(200);
    expect(res.body).toHaveProperty("token");
  });
});
