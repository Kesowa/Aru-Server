import { createAsset } from "./utils/asset";
import { CurriedUrl, Login, LoginSuper, Logout } from "./utils/utils";
import { SuperAgentTest } from "supertest";

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
const full_url = CurriedUrl("asset");

describe("/asset API", () => {
  test("POST /create", async () => {
    await createAsset(agent, superAdminAgent);
  });
  test("GET /get", async () => {
    const asset = await createAsset(agent, superAdminAgent);

    const res = await agent
      .get(full_url("get"))
      .query({
        assetID: asset._id,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: expect.any(Object),
    });
  });
  test("GET /get-all-asset", async () => {
    await createAsset(agent, superAdminAgent);

    const res = await agent
      .get(full_url("get-all-asset"))
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "All assets fetched",
      data: expect.any(Object),
    });
  });
  test("PATCH /update", async () => {
    const asset = await createAsset(agent, superAdminAgent);
    const res = await agent
      .patch(full_url("update"))
      .send({
        userID: asset.userID,
        tenantID: asset.tenantID,
        assetID: asset._id,
        assetInfo: [{ UIN: "7654321" }],
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: expect.any(Object),
    });
  });
  test("PATCH /toggle-asset-status", async () => {
    const asset = await createAsset(agent, superAdminAgent);
    const res = await agent
      .patch(full_url("toggle-asset-status"))
      .send({
        assetID: asset._id,
        isActive: "true",
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: expect.any(Object),
    });
  });
  test("DELETE /delete", async () => {
    const asset = await createAsset(agent, superAdminAgent);
    const res = await agent
      .delete(full_url("delete"))
      .send({
        assetID: asset._id,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: expect.any(Object),
    });
  });
});
