import { APP_URL, ConnectDB, CurriedUrl, DisconnectDB, Login, LoginSuper, Logout } from "./utils/utils";
import request, { SuperAgentTest } from "supertest";
import { faker } from "@faker-js/faker";
import { createTenant, createTenantPublic, registerTenant } from "./utils/tenant";
import { createPackage } from "./utils/package";
import { Mongoose } from "mongoose";

const full_url = CurriedUrl("admin/tenant");

describe("/admin/tenant API Public", () => {
  let publicAgent = request.agent(APP_URL);
  let mongoClient: Mongoose;
  beforeAll(async () => (mongoClient = await ConnectDB()), 60_000);
  afterAll(async () => await DisconnectDB(mongoClient));

  test("POST /register-tenant", async () => {
    await registerTenant(publicAgent);
  });

  test("POST /resend-verification-code", async () => {
    const newTenant = await registerTenant(publicAgent);
    const res = await publicAgent
      .post(full_url("resend-verification-code"))
      .send({
        email: newTenant.email,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
    });
  });

  test("POST /verify-tenant", async () => {
    await createTenantPublic(publicAgent, mongoClient);
  });

  test("GET /fetch-active-package-public", async () => {
    const res = await publicAgent
      .get(full_url("fetch-active-package-public"))
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: expect.any(Array),
    });
  });
});

describe("/admin/tenant API SuperAdmin", () => {
  // These routes use req.body.tenantId in controllers to target specific tenants
  // Some of them affect all existing tenants

  let superAdminAgent: SuperAgentTest;
  beforeAll(async () => (superAdminAgent = await LoginSuper()));
  afterAll(async () => await Logout(superAdminAgent));

  test("POST /create", async () => {
    await createTenant(superAdminAgent);
  });

  test("GET /fetchall", async () => {
    await createTenant(superAdminAgent);

    const res = await superAdminAgent
      .get(full_url("fetchall"))
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: expect.any(Array),
    });
  });

  test("POST /add-initial-package", async () => {
    const tenant = await createTenant(superAdminAgent);
    const pack = await createPackage(superAdminAgent);

    const res = await superAdminAgent
      .post(full_url("add-initial-package"))
      .send({
        tenantId: tenant._id,
        packageId: pack._id,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
    });
  });

  test("PATCH /edit-tenant", async () => {
    const tenant = await createTenant(superAdminAgent);

    const res = await superAdminAgent
      .patch(full_url("edit-tenant"))
      .send({
        tenantId: tenant._id,
        name: faker.company.name(),
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: expect.any(Object),
    });
  });

  test("POST /fetch-tenant-details", async () => {
    const tenant = await createTenant(superAdminAgent);

    const res = await superAdminAgent
      .post(full_url("fetch-tenant-details"))
      .send({
        tenantId: tenant._id,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: expect.any(Object),
    });
  });

  test("POST /add-actualSize-to-tenant", async () => {
    const tenant = await createTenant(superAdminAgent);

    const res = await superAdminAgent
      .post(full_url("add-actualSize-to-tenant"))
      .send({
        tenantId: tenant._id,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
    });
  });

  test("PATCH /updatepublicMapRef", async () => {
    const res = await superAdminAgent
      .patch(full_url("updatepublicMapRef"))
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
    });
  });

  test("DELETE /delete-tenant", async () => {
    const tenant = await createTenant(superAdminAgent);

    const res = await superAdminAgent
      .delete(full_url("delete-tenant"))
      .send({
        tenantId: tenant._id,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: expect.any(Object),
    });
  });
});

describe("/admin/tenant API TenantRoot", () => {
  // These routes use res.locals.user.tenantId._id in controllers

  let tenantRootAgent: SuperAgentTest;
  beforeAll(async () => (tenantRootAgent = await Login()));
  afterAll(async () => await Logout(tenantRootAgent));

  test("PATCH /add-all-count-to-tenant", async () => {
    const res = await tenantRootAgent
      .patch(full_url("add-all-count-to-tenant"))
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
    });
  });

  test("GET /get-tenant-stats", async () => {
    const res = await tenantRootAgent
      .get(full_url("get-tenant-stats"))
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      data: expect.any(Object),
      packageData: expect.any(Object),
    });
  });
});