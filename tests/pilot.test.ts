import { createUser } from "./utils/user";
import { CurriedUrl, Login, Logout } from "./utils/utils";
import {SuperAgentTest} from "supertest";

let agent: SuperAgentTest;

beforeAll(async () => (agent = await Login()));
afterAll(async () => await Logout(agent));
const full_url = CurriedUrl("pilot");

describe("/pilot API", () => {
  test("GET /get-all-pilots", async () => {
    await createUser(agent, "pilot");
    
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
