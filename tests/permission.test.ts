import { SUPER_ADMIN_PERMS, TENANT_ROOT_PERMS } from "./utils/permission";
import { CurriedUrl, Login, LoginSuper, Logout} from "./utils/utils";
import {SuperAgentTest} from "supertest";

const full_url = CurriedUrl("tenantroot/permission");

describe("/tenantroot/permission API SuperAdmin", () => {
  let agent: SuperAgentTest;
  beforeAll(async () => (agent = await LoginSuper()));
  afterAll(async () => await Logout(agent));

  test("GET /admin-permission-list", async () => {
    const res = await agent
      .get(full_url("admin-permission-list"))
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: [...SUPER_ADMIN_PERMS],
    });
  });
});

describe("/tenantroot/permission API TenantRoot", () => {
  let agent: SuperAgentTest;
  beforeAll(async () => (agent = await Login()));
  afterAll(async () => await Logout(agent));

  test("GET /tenant-permission-list", async () => {
    const res = await agent
      .get(full_url("tenant-permission-list"))
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: [...TENANT_ROOT_PERMS],
    });
  });
});
