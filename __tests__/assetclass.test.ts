import { CurriedUrl, Login, LoginSuper } from "../config/utils";
import request from "supertest";
import app from "../src/app";

let token: string;
const full_url = CurriedUrl("assetclass");

describe("/assetclass API SuperAdmin", () => {
  beforeAll(async () => (token = await LoginSuper()));
  const created_assetclasses: any = [];
  test("POST /create", async () => {
    const res = await request(app)
      .post(full_url("create"))
      .set("Authorization", `Bearer ${token}`)
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
      const res = await request(app)
        .post(full_url("create"))
        .set("Authorization", `Bearer ${token}`)
        .set("userid", "5f12572c3c19462d3673dbe9")
        .send({
          typeName: "Any name",
          createdAt: "2022-08-01",
        })
        .expect(201);
      created_assetclasses.push(res.body.data);
    }
    const res = await request(app)
      .patch(full_url("update"))
      .set("Authorization", `Bearer ${token}`)
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
      const res = await request(app)
        .post(full_url("create"))
        .set("Authorization", `Bearer ${token}`)
        .set("userid", "5f12572c3c19462d3673dbe9")
        .send({
          typeName: "Any name",
          createdAt: "2022-08-01",
        })
        .expect(201);
      created_assetclasses.push(res.body.data);
    }
    const res = await request(app)
      .delete(full_url("delete"))
      .set("Authorization", `Bearer ${token}`)
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
  beforeAll(async () => (token = await Login()));
  const existing_assetclasses: any = [];
  test("GET /get", async () => {
    const res = await request(app)
      .get(full_url("get"))
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Sucessfully fetched Asset classes",
      data: expect.any(Array),
    });
    existing_assetclasses.push(res.body.data[0]._id);
  });

  test("GET /get-asset-class-by-id", async () => {
    const res = await request(app)
      .get(full_url("get-asset-class-by-id"))
      .set("Authorization", `Bearer ${token}`)
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
