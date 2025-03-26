import { SuperAgentTest } from "supertest";
import { Login, LoginSuper, Logout } from "./utils/utils";

describe("/auth API", () => {
  let agent: SuperAgentTest;
  test("/login tenant-root", async () => {
     agent = await Login();
  });
  test("/logout tenant-root", async () => {
     await Logout(agent);
  });
  let superagent: SuperAgentTest;
  test("/login super-admin", async () => {
     superagent = await LoginSuper();
  });
  test("/logout super-admin", async () => {
     await Logout(superagent);
  });
});
