import { createAssetClass } from "./utils/assetclass";
import { CurriedUrl, Login, LoginSuper, Logout } from "./utils/utils";
import {SuperAgentTest} from "supertest";


const full_url = CurriedUrl("assetclass");

describe("/assetclass API SuperAdmin", () => {
  let agent: SuperAgentTest;
  beforeAll(async () => (agent = await LoginSuper()));
  afterAll(async () => await Logout(agent));
  test("POST /create", async () => {
    await createAssetClass(agent);
  });

  test("PATCH /update", async () => {
    const assetClass = await createAssetClass(agent);
    const res = await agent
      .patch(full_url("update"))
      .send({
        id: assetClass._id,
        typeName: "New Type Nameeee",
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: expect.any(Object),
    });
  });

  test("DELETE /delete", async () => {
    const assetClass = await createAssetClass(agent);
    const res = await agent
      .delete(full_url("delete"))
      .send({
        id: assetClass._id,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
    });
  });
});

describe("/assetclass API TenantRoot", () => {
  let agent: SuperAgentTest;
  let superagent: SuperAgentTest;
  beforeAll(async () => {
    agent = await Login();
    superagent = await LoginSuper();
  });
  afterAll(async () => {
    await Logout(agent);
    await Logout(superagent);
  });
  test("GET /get", async () => {
    await createAssetClass(superagent);
    const res = await agent
      .get(full_url("get"))
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: expect.any(Array),
    });
  });

  test("GET /get-asset-class-by-id", async () => {
    const assetClass = await createAssetClass(superagent);
    const res = await agent
      .get(full_url("get-asset-class-by-id"))
      .query({
        _id: assetClass._id,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: expect.any(Object),
    });
  });
});
