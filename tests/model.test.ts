import { CurriedUrl, Login, LoginSuper, Logout } from "./utils/utils";
import {SuperAgentTest} from "supertest";
import { createModel } from "./utils/model";
import { faker } from "@faker-js/faker";

let tenantAgent: SuperAgentTest;
beforeAll(async () => (tenantAgent = await Login()));
afterAll(async () => await Logout(tenantAgent));

let superAdminAgent: SuperAgentTest;
beforeAll(async () => (superAdminAgent = await LoginSuper()));
afterAll(async () => await Logout(superAdminAgent));

const full_url = CurriedUrl("model");

describe("/model API", () => {
  test("POST /create", async () => {
    await createModel(tenantAgent, superAdminAgent);
  });

  test("GET /get", async () => {
    await createModel(tenantAgent, superAdminAgent);;

    const res = await tenantAgent
      .get(full_url("get"))
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: expect.any(Array),
    });
  });

  test("GET /get-by-id", async () => {
    const model = await createModel(tenantAgent, superAdminAgent);;

    const res = await tenantAgent
      .get(full_url("get-by-id"))
      .query({
        _id: model._id,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: expect.any(Object),
    });
  });

  test("PATCH /update", async () => {
    const model = await createModel(tenantAgent, superAdminAgent);;

    const res = await tenantAgent
      .patch(full_url("update"))
      .send({
        id: model._id,
        update: {
          modelName: faker.random.words(2),
          modelNumber: faker.random.numeric(5),
          dimensions: {
            length: faker.random.numeric(1),
            breadth: faker.random.numeric(1),
            height: faker.random.numeric(1),
          },
        },
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: expect.any(Object),
    });
  });

  test("DELETE /delete", async () => {
    const model = await createModel(tenantAgent, superAdminAgent);;

    const res = await tenantAgent
      .delete(full_url("delete"))
      .send({
        id: model._id,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
    });
  });
});
