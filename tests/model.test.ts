import { CurriedUrl, Login, Logout } from "./utils/utils";
import {SuperAgentTest} from "supertest";
import { randomUUID } from "crypto";

let agent: SuperAgentTest;

beforeAll(async () => (agent = await Login()));
afterAll(async () => Logout(agent));
const full_url = CurriedUrl("model");

describe("/model API", () => {
  test("POST /create", async () => {
    const res = await agent
      .post(full_url("create"))
      .set("userid", "5f12572c3c19462d3673dbe9") // id of super-admin user KESOWA (exists in database) (any other id would also work)
      .send({
        modelName: randomUUID(),
        modelNumber: Math.floor(Math.random() * 100000).toString(),
        assetClassID: "60ae07d5b4ed84014ad4ab28", // doesn't yet exist in database
        dimensions: {
          length: Math.floor(Math.random() * 10),
          breadth: Math.floor(Math.random() * 10),
          height: Math.floor(Math.random() * 10),
        },
        manufacturerID: "615acf24e5324204d8b97c84", // doesn't yet exist in database
        website: randomUUID(),
        props: {
          payloads: randomUUID(), // can be any property
        },
      })
      .expect(201);

    expect(res.body).toMatchObject({
      status: true,
      message: "Successfully saved the Model",
      data: expect.any(Object),
    });
  });

  test("GET /get", async () => {
    await agent
      .post(full_url("create"))
      .set("userid", "5f12572c3c19462d3673dbe9")
      .send({
        modelName: randomUUID(),
        modelNumber: Math.floor(Math.random() * 100000).toString(),
        assetClassID: "60ae07d5b4ed84014ad4ab28",
        dimensions: {
          length: Math.floor(Math.random() * 10),
          breadth: Math.floor(Math.random() * 10),
          height: Math.floor(Math.random() * 10),
        },
        manufacturerID: "615acf24e5324204d8b97c84",
        website: randomUUID(),
        props: {
          payloads: randomUUID(),
        },
      })
      .expect(201);
    const res = await agent
      .get(full_url("get"))
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Models fetched sucessfully.",
      data: expect.any(Array),
    });
  });

  test("GET /get-by-id", async () => {
    const created_models: any[] = [];
    {
      const res = await agent
        .post(full_url("create"))
        .set("userid", "5f12572c3c19462d3673dbe9")
        .send({
          modelName: randomUUID(),
          modelNumber: Math.floor(Math.random() * 100000).toString(),
          assetClassID: "60ae07d5b4ed84014ad4ab28",
          dimensions: {
            length: Math.floor(Math.random() * 10),
            breadth: Math.floor(Math.random() * 10),
            height: Math.floor(Math.random() * 10),
          },
          manufacturerID: "615acf24e5324204d8b97c84",
          website: randomUUID(),
          props: {
            payloads: randomUUID(),
          },
        })
        .expect(201);
      created_models.push(res.body.data);
    }
    const res = await agent
      .get(full_url("get-by-id"))
      .query({
        _id: created_models[0]._id,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Model fetched sucessfully.",
      data: expect.any(Object),
    });
  });

  test("PATCH /update", async () => {
    const created_models: any[] = [];
    {
      const res = await agent
        .post(full_url("create"))
        .set("userid", "5f12572c3c19462d3673dbe9")
        .send({
          modelName: randomUUID(),
          modelNumber: Math.floor(Math.random() * 100000).toString(),
          assetClassID: "60ae07d5b4ed84014ad4ab28",
          dimensions: {
            length: Math.floor(Math.random() * 10),
            breadth: Math.floor(Math.random() * 10),
            height: Math.floor(Math.random() * 10),
          },
          manufacturerID: "615acf24e5324204d8b97c84",
          website: randomUUID(),
          props: {
            payloads: randomUUID(),
          },
        })
        .expect(201);
      created_models.push(res.body.data);
    }
    const res = await agent
      .patch(full_url("update"))
      .send({
        id: created_models[0]._id,
        update: {
          modelName: randomUUID(),
          modelNumber: Math.floor(Math.random() * 100000).toString(),
          dimensions: {
            length: Math.floor(Math.random() * 10),
            breadth: Math.floor(Math.random() * 10),
            height: Math.floor(Math.random() * 10),
          },
        },
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Model updated sucessfully.",
      data: expect.any(Object),
    });
  });

  test("DELETE /delete", async () => {
    const created_models: any[] = [];
    {
      const res = await agent
        .post(full_url("create"))
        .set("userid", "5f12572c3c19462d3673dbe9")
        .send({
          modelName: randomUUID(),
          modelNumber: Math.floor(Math.random() * 100000).toString(),
          assetClassID: "60ae07d5b4ed84014ad4ab28",
          dimensions: {
            length: Math.floor(Math.random() * 10),
            breadth: Math.floor(Math.random() * 10),
            height: Math.floor(Math.random() * 10),
          },
          manufacturerID: "615acf24e5324204d8b97c84",
          website: randomUUID(),
          props: {
            payloads: randomUUID(),
          },
        })
        .expect(201);
      created_models.push(res.body.data);
    }
    const res = await agent
      .delete(full_url("delete"))
      .send({
        id: created_models[0]._id,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Model successfully deleted",
    });
  });
});
