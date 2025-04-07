import { CurriedUrl, Login, LoginSuper, Logout, clearAllClients } from "./utils/utils";
import { SuperAgentTest } from "supertest";
import { faker } from "@faker-js/faker";
import { addClientToMission, createClient } from "./utils/client";
import { createMission } from "./utils/mission";

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
const full_url = CurriedUrl("client");

describe("/client API", () => {
  test("POST /create", async () => {
    await createClient(agent);
  });

  test("PATCH /edit-client-details", async () => {
    const client = await createClient(agent);
    const res = await agent
      .patch(full_url("edit-client-details"))
      .send({
        id: client._id,
        password: faker.internet.password(),
        expiryDate: faker.date.future().toISOString().split("T")[0],
        // avatar: " ",
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: expect.any(Object),
    });
  });

  test("PATCH /insert-client-for-mission", async () => {
    const client = await createClient(agent);
    const { mission } = await createMission(agent, superAdminAgent);
    await addClientToMission(agent, client._id, mission._id);
  });

  test("PATCH /remove-client-from-mission", async () => {
    const client = await createClient(agent);
    const { mission } = await createMission(agent, superAdminAgent);
    await addClientToMission(agent, client._id, mission._id);
    const res = await agent
      .patch(full_url("remove-client-from-mission"))
      .query({
        id: mission._id,
        clientId: client._id,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: expect.any(Object),
    });
  });

  test("GET /get-list-client", async () => {
    await createClient(agent);
    await createClient(agent);
    await createClient(agent);
    const res = await agent
      .get(full_url("get-list-client"))
      .query({
        page: 1,
        limit: 5,
        sort: "name:desc",
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: expect.any(Array),
      total: expect.any(Number),
    });
  });

  test("GET /get-client-by-email", async () => {
    const client = await createClient(agent);
    const res = await agent
      .get(full_url("get-client-by-email"))
      .query({
        email: client.email,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: expect.any(Object),
    });
  });

  test("GET /get-client-mission-details/:missionID", async () => {
    const client = await createClient(agent);
    const { mission } = await createMission(agent, superAdminAgent);
    await addClientToMission(agent, client._id, mission._id);
    const res = await agent
      .get(full_url("get-client-mission-details/61f3b1e65f915a05cb8885ec"))
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: expect.any(Object),
    });
  });

  test("GET /get-mission-list-for-Id", async () => {
    const client = await createClient(agent);
    const { mission } = await createMission(agent, superAdminAgent);
    await addClientToMission(agent, client._id, mission._id);
    // !TODO requires client login
    const res = await agent
      .get(full_url("get-mission-list-for-Id"))
      .query({
        page: "1",
        limit: "1",
        status: "All",
        clientId: client._id,
        createdAt: "desc",
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: expect.any(Array),
    });
  });

  test("GET /geneate-client-csv", async () => {
    const res = await agent
      .get(full_url("geneate-client-csv"))
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      pathh: expect.any(String),
    });
  });

  test("DELETE /delete-client", async () => {
    const client = await createClient(agent);
    const res = await agent
      .delete(full_url("delete-client"))
      .send({
        id: client._id,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: expect.any(Object),
    });
  });

  test("POST /invite-client-to-mission", async () => {
    const { mission } = await createMission(agent, superAdminAgent);
    const emailID: string = faker.internet.email();
    const res = await agent
      .post(full_url("invite-client-to-mission"))
      .send({
        missionID: mission._id,
        emailID: emailID,
      })
      .expect(200);
    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: expect.any(Object),
    });
  });

  test("GET /register/:inviteId", async () => {
    const { mission } = await createMission(agent, superAdminAgent);
    const emailID: string = faker.internet.email();
    let inviteID: string = "";
    {
      const res = await agent
        .post(full_url("invite-client-to-mission"))
        .send({
          missionID: mission._id,
          emailID: emailID,
        })
        .expect(200);
      inviteID = res.body.data.inviteID;
    }
    await agent
      .get(full_url("register/" + inviteID))
      .expect(302); // redirects to change password page
  });
});
