import { CurriedUrl, Login, LoginSuper } from "../config/utils";
import request from "supertest";
import app from "../src/app";
import { randomUUID } from "crypto";

let token: string;

describe("/admin/permission API", () => {
  beforeAll(async () => (token = await LoginSuper()));
  const full_url = CurriedUrl("admin/permission");

  test("POST /create", async () => {
    const res = await request(app)
      .post(full_url("create"))
      .set("Authorization", `Bearer ${token}`)
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
    {
      const res = await request(app)
        .post(full_url("create"))
        .set("Authorization", `Bearer ${token}`)
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
    }
    const res = await request(app)
      .get(full_url("admin-permission-list"))
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Permissions fetched sucessfully.",
      data: expect.any(Array),
    });
  });
});

describe("/tenantroot/permission API", () => {
  beforeAll(async () => (token = await Login()));
  const full_url = CurriedUrl("tenantroot/permission");

  test("GET /tenant-permission-list", async () => {
    const res = await request(app)
      .get(full_url("tenant-permission-list"))
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Permissions fetched sucessfully.",
      data: expect.any(Array),
    });
  });
});
