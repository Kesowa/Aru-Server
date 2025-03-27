import { CurriedUrl, Login, Logout } from "./utils/utils";
import {SuperAgentTest} from "supertest";
import { createUsergroup } from "./utils/usergroup";
import { PERMS } from "./utils/permission";

let agent: SuperAgentTest;
beforeAll(async () => (agent = await Login()));
afterAll(async () => await Logout(agent));
const full_url = CurriedUrl("tenant/usergroup");

describe("/tenant/usergroup API", () => {
  test("POST /tenant-usergroup-create", async () => {
    await createUsergroup(agent);
  });

  test("GET /tenant-usergroup-list", async () => {
    await createUsergroup(agent);

    const res = await agent
      .get(full_url("tenant-usergroup-list"))
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: expect.any(Array),
    });
  });

  test("GET /tenant-usergroup-by-id", async () => {
    const usergroup = await createUsergroup(agent);

    const res = await agent
      .get(full_url("tenant-usergroup-by-id"))
      .query({
        id: usergroup._id,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: expect.any(Object),
    });
  });

  test("PATCH /tenant-usergroup-edit", async () => {
    const usergroup = await createUsergroup(agent);

    const res = await agent
      .patch(full_url("tenant-usergroup-edit"))
      .send({
        id: usergroup._id,
        name: Date(),
        permissions: [PERMS.MISSION_LIST],
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: expect.any(Object),
    });
  });

  test("DELETE /tenant-usergroup-delete", async () => {
    const usergroup = await createUsergroup(agent);

    const res = await agent
      .delete(full_url("tenant-usergroup-delete"))
      .query({
        id: usergroup._id,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
    });
  });
});
