import { CurriedUrl, Login, LoginSuper, Logout} from "./utils/utils";
import {SuperAgentTest} from "supertest";
import { randomUUID } from "crypto";

let agent: SuperAgentTest;


describe("/admin/permission API", () => {
  beforeAll(async () => (agent = await LoginSuper()));
  afterAll(async () => Logout(agent));
  const full_url = CurriedUrl("admin/permission");

  test("POST /create", async () => {
    const res = await agent
      .post(full_url("create"))
      .send({
        name: randomUUID(),
        isFrontendRoute: true,
        isVisibleToTenant: true,
        isVisibleToSuperAdmin: true,
        isPilot: true,
        isSideNavOption: true,
        frontendRoute: "/dashboard/" + randomUUID(),
        sideNavOptionIcon: randomUUID(),
        sideNavOptionLabel: randomUUID(),
      })
      .expect(201);

    expect(res.body).toMatchObject({
      status: true,
      message: "permission created sucessfully",
    });
  });

  test("GET /admin-permission-list", async () => {
    await agent
      .post(full_url("create"))
      .send({
        name: randomUUID(),
        isFrontendRoute: true,
        isVisibleToTenant: true,
        isVisibleToSuperAdmin: true,
        isPilot: true,
        isSideNavOption: true,
        frontendRoute: "/dashboard/" + randomUUID(),
        sideNavOptionIcon: randomUUID(),
        sideNavOptionLabel: randomUUID(),
      })
      .expect(201);
    const res = await agent
      .get(full_url("admin-permission-list"))
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Permissions fetched sucessfully.",
      data: expect.any(Array),
    });
  });
});

describe("/tenantroot/permission API", () => {
  beforeAll(async () => (agent = await Login()));
  const full_url = CurriedUrl("tenantroot/permission");

  test("GET /tenant-permission-list", async () => {
    const res = await agent
      .get(full_url("tenant-permission-list"))
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Permissions fetched sucessfully.",
      data: expect.any(Array),
    });
  });
});
