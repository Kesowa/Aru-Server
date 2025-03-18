import { CurriedUrl, Login, LoginSuper, Logout } from "./utils/utils";
import {SuperAgentTest} from "supertest";

let agent: SuperAgentTest;

const full_url = CurriedUrl("assetclass");

describe("/assetclass API SuperAdmin", () => {
  beforeAll(async () => (agent = await LoginSuper()));
  afterAll(async () => Logout(agent));
  const created_assetclasses: any = [];
  test("POST /create", async () => {
    const res = await agent
      .post(full_url("create"))
      .set("userid", "5f12572c3c19462d3673dbe9")
      .send({
        typeName: "Any name",
        createdAt: "2022-08-01",
      })
      .expect(201);

    expect(res.body).toMatchObject({
      status: true,
      message: "Sucessfully created asset class",
      data: expect.any(Object),
    });

    created_assetclasses.push(res.body.data);
  });

  test("PATCH /update", async () => {
    {
      const res = await agent
        .post(full_url("create"))
        .set("userid", "5f12572c3c19462d3673dbe9")
        .send({
          typeName: "Any name",
          createdAt: "2022-08-01",
        })
        .expect(201);
      created_assetclasses.push(res.body.data);
    }
    const res = await agent
      .patch(full_url("update"))
      .send({
        id: created_assetclasses[0]._id,
        typeName: "New Type Nameeee",
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Sucessfully updated the assetClass",
      data: expect.any(Object),
    });
  });

  test("DELETE /delete", async () => {
    {
      const res = await agent
        .post(full_url("create"))
        .set("userid", "5f12572c3c19462d3673dbe9")
        .send({
          typeName: "Any name",
          createdAt: "2022-08-01",
        })
        .expect(201);
      created_assetclasses.push(res.body.data);
    }
    const res = await agent
      .delete(full_url("delete"))
      .send({
        id: created_assetclasses[0]._id,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Doc successfully deleted",
    });
  });
});

describe("/assetclass API TenantRoot", () => {
  beforeAll(async () => (agent = await Login()));
  const existing_assetclasses: any = [];
  test("GET /get", async () => {
    const res = await agent
      .get(full_url("get"))
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Sucessfully fetched Asset classes",
      data: expect.any(Array),
    });
    existing_assetclasses.push(res.body.data[0]._id);
  });

  test("GET /get-asset-class-by-id", async () => {
    const res = await agent
      .get(full_url("get-asset-class-by-id"))
      .query({
        _id: existing_assetclasses[0],
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Asset fetched sucessfully.",
      data: expect.any(Object),
    });
  });
});
