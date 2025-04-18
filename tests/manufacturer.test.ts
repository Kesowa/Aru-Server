import { CurriedUrl, Login, Logout } from "./utils/utils";
import {SuperAgentTest} from "supertest";
import { faker } from "@faker-js/faker";
import { createManufacturer } from "./utils/manufacturer";

let agent: SuperAgentTest;

beforeAll(async () => (agent = await Login()));
afterAll(async () => await Logout(agent));
const full_url = CurriedUrl("manufacturer");

describe("/manufacturer API", () => {
  test("POST /create", async () => {
    await createManufacturer(agent);
  });

  test("GET /get", async () => {
    await createManufacturer(agent);

    const res = await agent
      .get(full_url("get"))
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: expect.any(Array),
    });
  });

  test("GET /get-by-id", async () => {
    const manufacturer = await createManufacturer(agent);

    const res = await agent
      .get(full_url("get-by-id"))
      .query({
        _id: manufacturer._id,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: expect.any(Array),
    });
  });

  test("PATCH /update", async () => {
    const manufacturer = await createManufacturer(agent);

    const res = await agent
      .patch(full_url("update"))
      .send({
        id: manufacturer._id,
        update: {
          nationality: faker.address.country(),
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
    const manufacturer = await createManufacturer(agent);

    const res = await agent
      .delete(full_url("delete"))
      .send({
        id: manufacturer._id,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
    });
  });
});
