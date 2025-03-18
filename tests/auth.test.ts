import { SuperAgentTest } from "supertest";
import { Login, Logout } from "./utils/utils";

describe("/auth API", () => {
  let agent: SuperAgentTest;
  test("/login", async () => {
     agent = await Login();
  });
  test("/logout", async () => {
     await Logout(agent);
  });
});
