import { CurriedUrl, Login, Logout } from "./utils/utils";
import {SuperAgentTest} from "supertest";
import { faker } from "@faker-js/faker";
import { uploadFile } from "./utils/upload";
import { createUser } from "./utils/user";

let agent: SuperAgentTest;
beforeAll(async () => (agent = await Login()));
afterAll(async () => await Logout(agent));
const full_url = CurriedUrl("tenant/user");

describe("/tenant/user API", () => {
  test("POST /upload-profile-picture", async () => {
    await uploadFile(agent, "./assets/image.png");
  });

  test("POST /create-tenant-user", async () => {
    await createUser(agent);
  });

  test("GET /fetch-all-user", async () => {
    await createUser(agent);

    const res = await agent
      .get(full_url("fetch-all-user"))
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: expect.any(Array),
    });
  });

  test("GET /generate-userList-csv", async () => {
    await createUser(agent);

    const res = await agent
      .get(full_url("generate-userList-csv"))
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      pathh: expect.any(String),
    });
  });

  test("PATCH /edit-user", async () => {
    const user = await createUser(agent);

    const res = await agent
      .patch(full_url("edit-user"))
      .send({
        id: user._id,
        name: faker.name.fullName(),
        phoneNo: faker.phone.number("8#########"),
        email: faker.internet.email(),
        aadhaarNo: faker.random.numeric(12),
        pilotLicenceNo: faker.random.numeric(6),
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: expect.any(Object),
    });
  });

  test("PATCH /terms-conditions-check", async () => {
    await createUser(agent);
    
    const res = await agent
      .patch(full_url("terms-conditions-check"))
      .query({
        terms: "true",
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: expect.any(Object),
    });
  });

  test("POST /terms-insert", async () => {
    await createUser(agent);

    const res = await agent
      .post(full_url("terms-insert"))
      .query({
        flag: "go",
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
    });
  });

  test("DELETE /delete-user", async () => {
    const user = await createUser(agent);
    
    const res = await agent
      .delete(full_url("delete-user"))
      .query({
        id: user._id,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
    });
  });
});
