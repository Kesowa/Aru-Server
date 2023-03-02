import { CurriedUrl, Login, clearAllClients } from "../config/utils";
import request from "supertest";
import app from "../src/app";
import { faker } from "@faker-js/faker";

let token: string;
beforeAll(async () => (token = await Login()));
const full_url = CurriedUrl("client");

const fake_client = () => ({
  name: faker.name.fullName(),
  email: faker.internet.email(),
  phoneNo: faker.phone.number("8#########"),
  userGroupId: "6108e040e7147ec0fca69aee",
  userType: "tenant-client",
  country: "India",
  city: "Kolkata",
  expiryDate: faker.date.future().toISOString().split("T")[0],
  avatar: " ",
});

describe("/client API", () => {
  afterAll(async () => {
    await clearAllClients();
  });

  test("POST /create", async () => {
    const res = await request(app)
      .post(full_url("create"))
      .set("Authorization", `Bearer ${token}`)
      .send(fake_client())
      .expect(201);

    expect(res.body).toMatchObject({
      status: true,
      message: "Client created! Check email to change password",
      data: expect.any(Object),
    });
  });

  test("PATCH /edit-client-details", async () => {
    const created_clients: any = [];
    {
      const res = await request(app)
        .post(full_url("create"))
        .set("Authorization", `Bearer ${token}`)
        .send(fake_client())
        .expect(201);
      // console.error(res.body);
      created_clients.push(res.body.data);
    }
    const res = await request(app)
      .patch(full_url("edit-client-details"))
      .set("Authorization", `Bearer ${token}`)
      .send({
        id: created_clients[0]._id,
        password: faker.internet.password(),
        expiryDate: faker.date.future().toISOString().split("T")[0],
        avatar: " ",
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Client data successfully updated!",
      data: expect.any(Object),
    });
  });

  test("PATCH /insert-client-for-mission", async () => {
    const created_clients: any = [];
    {
      const res = await request(app)
        .post(full_url("create"))
        .set("Authorization", `Bearer ${token}`)
        .send(fake_client())
        .expect(201);
      created_clients.push(res.body.data);
    }
    const res = await request(app)
      .patch(full_url("insert-client-for-mission"))
      .set("Authorization", `Bearer ${token}`)
      .send({
        missionId: "61f3b1e65f915a05cb8885ec",
        clientId: [created_clients[0]._id],
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Client inserted successfully!",
      data: expect.any(Array),
    });
  });

  test("PATCH /remove-client-from-mission", async () => {
    const created_clients: any = [];
    {
      const res = await request(app)
        .post(full_url("create"))
        .set("Authorization", `Bearer ${token}`)
        .send(fake_client())
        .expect(201);
      created_clients.push(res.body.data);
    }
    {
      const res = await request(app)
        .patch(full_url("insert-client-for-mission"))
        .set("Authorization", `Bearer ${token}`)
        .send({
          missionId: "61f3b1e65f915a05cb8885ec",
          clientId: [created_clients[0]._id],
        })
        .expect(200);
    }
    const res = await request(app)
      .patch(full_url("remove-client-from-mission"))
      .set("Authorization", `Bearer ${token}`)
      .query({
        id: "61f3b1e65f915a05cb8885ec",
        clientId: created_clients[0]._id,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Client removed for MissionId:61f3b1e65f915a05cb8885ec",
      data: expect.any(Object),
    });
  });

  test("GET /get-list-client", async () => {
    const created_clients: any = [];
    {
      const res = await request(app)
        .post(full_url("create"))
        .set("Authorization", `Bearer ${token}`)
        .send(fake_client())
        .expect(201);
      created_clients.push(res.body.data);
    }
    const res = await request(app)
      .get(full_url("get-list-client"))
      .set("Authorization", `Bearer ${token}`)
      .query({
        page: 1,
        limit: 5,
        sort: "name:desc",
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Data fetched successfully!",
      data: expect.any(Array),
      total: res.body.data.length,
    });
  });

  test("GET /get-client-by-email", async () => {
    const created_clients: any = [];
    {
      const res = await request(app)
        .post(full_url("create"))
        .set("Authorization", `Bearer ${token}`)
        .send(fake_client())
        .expect(201);
      created_clients.push(res.body.data);
    }
    const res = await request(app)
      .get(full_url("get-client-by-email"))
      .set("Authorization", `Bearer ${token}`)
      .query({
        email: created_clients[0].email,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "client found",
      data: expect.any(Object),
    });
  });

  test("GET /get-client-mission-details/:missionID", async () => {
    const res = await request(app)
      .get(full_url("get-client-mission-details/61f3b1e65f915a05cb8885ec"))
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Mission fetched",
      data: expect.any(Object),
    });
  });

  test("GET /get-mission-list-for-Id", async () => {
    const created_clients: any = [];
    {
      const res = await request(app)
        .post(full_url("create"))
        .set("Authorization", `Bearer ${token}`)
        .send(fake_client())
        .expect(201);
      created_clients.push(res.body.data);
    }
    {
      const res = await request(app)
        .patch(full_url("insert-client-for-mission"))
        .set("Authorization", `Bearer ${token}`)
        .send({
          missionId: "61f3b1e65f915a05cb8885ec",
          clientId: [created_clients[0]._id],
        })
        .expect(200);
    }
    const res = await request(app)
      .get(full_url("get-mission-list-for-Id"))
      .set("Authorization", `Bearer ${token}`)
      .query({
        page: "1",
        limit: "1",
        status: "All",
        clientId: created_clients[0]._id,
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
    const res = await request(app)
      .get(full_url("geneate-client-csv"))
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Client CSV generated successfully!",
      pathh: "/",
    });
  });

  test("PATCH /patch-api-clientarr", async () => {
    const res = await request(app)
      .patch(full_url("patch-api-clientarr"))
      .set("Authorization", `Bearer ${token}`)
      .send({
        tenantId: "5f204f03b9445726102781a8",
      })
      .expect(200);
    expect(res.text).toMatch("Updated");
  });

  test("DELETE /delete-client", async () => {
    const created_clients: any = [];
    {
      const res = await request(app)
        .post(full_url("create"))
        .set("Authorization", `Bearer ${token}`)
        .send(fake_client())
        .expect(201);
      created_clients.push(res.body.data);
    }
    const res = await request(app)
      .delete(full_url("delete-client"))
      .set("Authorization", `Bearer ${token}`)
      .send({
        id: created_clients[0]._id,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "client deleted successfully!",
      data: expect.any(Object),
    });
  });

  test("POST /invite-client-to-mission", async () => {
    const emailID: string = faker.internet.email();
    const res = await request(app)
      .post(full_url("invite-client-to-mission"))
      .set("Authorization", `Bearer ${token}`)
      .send({
        missionID: "61f3b1e65f915a05cb8885ec",
        emailID: emailID,
      })
      .expect(200);
    expect(res.body).toMatchObject({
      status: true,
      message: "invite sent to " + emailID.toLowerCase(),
      data: expect.any(Object),
    });
  });

  test("GET /register/:inviteId", async () => {
    const emailID: string = faker.internet.email();
    let inviteID: string = "";
    {
      const res = await request(app)
        .post(full_url("invite-client-to-mission"))
        .set("Authorization", `Bearer ${token}`)
        .send({
          missionID: "61f3b1e65f915a05cb8885ec",
          emailID: emailID,
        })
        .expect(200);
      inviteID = res.body.data.inviteID;
    }
    await request(app)
      .get(full_url("register/" + inviteID))
      .set("Authorization", `Bearer ${token}`)
      .expect(302); // redirects to change password page
  });
});
