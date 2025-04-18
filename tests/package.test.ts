import { CurriedUrl, LoginSuper, Logout } from "./utils/utils";
import {SuperAgentTest} from "supertest";
import { uploadFile } from "./utils/upload";
import { createPackage } from "./utils/package";
import { faker } from "@faker-js/faker";

let agent: SuperAgentTest;

beforeAll(async () => (agent = await LoginSuper()));
afterAll(async () => await Logout(agent));
const full_url = CurriedUrl("admin/package");

describe("/admin/package API", () => {
  test("POST /upload-poster", async () => {
    await uploadFile(agent, "./assets/image.png");
  });

  test("POST /create", async () => {
    await createPackage(agent);
  });

  test("GET /fetchall", async () => {
    await createPackage(agent);
    const res = await agent
      .get(full_url("fetchall"))
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: expect.any(Array),
    });
  });

  test("GET /fetch-by-id", async () => {
    const pack = await createPackage(agent);
    const res = await agent
      .get(full_url("fetch-by-id"))
      .query({
        id: pack._id,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: expect.any(Object),
    });
  });

  test("GET /fetchactive", async () => {
    await createPackage(agent);
    const res = await agent
      .get(full_url("fetchactive"))
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: expect.any(Array),
    });
  });

  test("PATCH /edit-package-for-Id", async () => {
    const pack = await createPackage(agent);
    const res = await agent
      .patch(full_url("edit-package-for-Id"))
      .send({
        _id: pack._id,
        name: Date(),
        bandwidth: faker.random.numeric(3),
        storage: faker.random.numeric(3),
        duration: faker.random.numeric(3),
        userCount: faker.random.numeric(3),
        missionCount: faker.random.numeric(2),
        layerCount: faker.random.numeric(3),
        alertCount: faker.random.numeric(3),
        vodCount: faker.random.numeric(2),
        clientCount: faker.random.numeric(2),
        locationCount: faker.random.numeric(2),
        userGroupCount: faker.random.numeric(2),
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: expect.any(Object),
    });
  });

  test("DELETE /delete-package-for-Id", async () => {
    const pack = await createPackage(agent);
    const res = await agent
      .delete(full_url("delete-package-for-Id"))
      .send({
        _id: pack._id,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: expect.any(Object),
    });
  });
});
