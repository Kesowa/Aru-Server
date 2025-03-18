import { CurriedUrl, Login, Logout } from "./utils/utils";
import {SuperAgentTest} from "supertest";

let agent: SuperAgentTest;

beforeAll(async () => (agent = await Login()));
afterAll(async () => await Logout(agent));
const full_url = CurriedUrl("pilot");

describe("/pilot API", () => {
  // Endpoint returns no response
  // test("POST /login", async () => {
  //     const res = await agent
  //         .post(full_url("login"))
  //         .expect(200);
  // });

  test("GET /get-all-pilots", async () => {
    const res = await agent
      .get(full_url("get-all-pilots"))
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: expect.any(Array),
    });
  });
});
