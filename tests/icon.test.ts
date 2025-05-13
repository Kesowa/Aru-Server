import { SuperAgentTest } from "supertest";
import { CurriedUrl, Login, LoginSuper, Logout } from "./utils/utils";
import { createIcon } from "./utils/icon";

let agent: SuperAgentTest;
let superAdminAgent: SuperAgentTest;
beforeAll(async () => {
  agent = await Login();
  superAdminAgent = await LoginSuper();
});
afterAll(async () => {
  await Logout(agent);
  await Logout(superAdminAgent);
});
const full_url = CurriedUrl("icon");

describe("/icon API", () => {
  test("POST /create", async () => {
    await createIcon(agent);
  });

  test("GET /list", async () => {
    const icons = await Promise.all([
      createIcon(agent),
      createIcon(agent),
      createIcon(agent),
      createIcon(agent),
    ]);

    const res = await agent
      .get(full_url("list"))
      .send({
        name: icons[0].name,
        tags: ["lorem"],
      })
      .expect(200);
    expect(res.body).toMatchObject({
      status: true,
      data: expect.any(Array),
    });
    expect(res.body.data.length).toBeGreaterThanOrEqual(icons.length);
  });

  test("DELETE /:iconID", async () => {
    const icon = await createIcon(agent);
    const res = await agent
      .delete(full_url(icon._id))
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
    });
  });
});
