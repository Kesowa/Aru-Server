import { CurriedUrl, Login, LoginSuper, Logout } from "./utils/utils";
import {SuperAgentTest} from "supertest";
import { createVOD, createVODStreamKey } from "./utils/vod";
import { faker } from "@faker-js/faker";

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
const full_url = CurriedUrl("VOD");

describe("/vod API", () => {

  test("POST /save-VOD", async () => {
    await createVODStreamKey(agent,superAdminAgent);
  });

  test.skip("POST /save-vod-manual", async () => {
    await createVOD(agent, superAdminAgent);
  });

  test("GET /get-by-ID", async () => {
    const vod = await createVOD(agent, superAdminAgent);
    const res = await agent
      .post(full_url("get-by-ID"))
      .send({
        Id: [vod._id],
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: expect.any(Array),
    });
  });

  test("GET /get-by-missionID", async () => {
    const vod = await createVOD(agent, superAdminAgent);
    const res = await agent
      .get(full_url("get-by-missionID"))
      .query({
        missionID: vod.missionID.toString(),
        page: 0,
        limit: 10,
        sort: "createdAt:desc",
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      TotalPages: expect.any(Number),
      data: expect.any(Array),
    });
  });

  test("GET /get-count-by-missionID", async () => {
    const vod = await createVOD(agent, superAdminAgent);
    const res = await agent
      .get(full_url("get-count-by-missionID"))
      .query({
        missionID: vod.missionID.toString(),
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: {
        count: expect.any(Number),
      },
    });
  });

  test("GET /get-by-flightID", async () => {
    const vod = await createVOD(agent, superAdminAgent);
    const res = await agent
      .get(full_url("get-by-flightID"))
      .query({
        flightID: vod.flightID.toString(),
        page: 0,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      TotalPages: expect.any(Number),
      data: expect.any(Array),
    });
  });

  test("GET /get-by-location-ID", async () => {
    const vod = await createVOD(agent, superAdminAgent);
    const res = await agent
      .get(full_url("get-by-location-ID"))
      .query({
        id: vod.locationID.toString(),
        page: 1,
        limit: 10,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: expect.any(Array),
      total: expect.any(Number),
    });
  });

  test("PATCH /edit-by-ID", async () => {
    const vod = await createVOD(agent, superAdminAgent);
    const res = await agent
      .patch(full_url("edit-by-ID"))
      .send({
        id: vod._id,
        update: {
          videoName: faker.random.words(2),
        },
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: expect.any(Object),
    });
  });

  test("DELETE /delete-by-ID", async () => {
    const vod = await createVOD(agent, superAdminAgent);
    const res = await agent
      .delete(full_url("delete-by-ID"))
      .send({
        Id: vod._id.toString(),
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: expect.any(Object),
    });
  });

  test("DELETE /delete-multi-by-ID", async () => {
    const vod = await createVOD(agent, superAdminAgent);
    const res = await agent
      .delete(full_url("delete-multi-by-ID"))
      .send({
        Id: [vod._id.toString()],
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: {
        errors: [],
        deleted: [vod._id],
      },
    });
  });

  test("PATCH /update-vod-by-ID", async () => {
    const vod = await createVOD(agent, superAdminAgent);
    const res = await agent
      .patch(full_url("update-vod-by-ID"))
      .send({
        id: vod._id.toString(),
        update: {
          videoName: faker.random.words(2),
        },
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: expect.any(Object),
    });
  });

  test("PATCH /update-multi-vod-by-ID", async () => {
    const vod = await createVOD(agent, superAdminAgent);
    const res = await agent
      .patch(full_url("update-multi-vod-by-ID"))
      .send({
        Id: [vod._id.toString()],
        update: {
          videoName: faker.random.words(2),
        },
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: expect.any(Object),
    });
  });
});
