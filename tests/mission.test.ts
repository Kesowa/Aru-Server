import { CurriedUrl, Login, LoginSuper, Logout } from "./utils/utils";
import {SuperAgentTest} from "supertest";
import { createMission } from "./utils/mission";
import { faker } from "@faker-js/faker";
import { createMissionType } from "./utils/missionType";

let tenantAgent: SuperAgentTest;
let superAdminAgent: SuperAgentTest;

const full_url = CurriedUrl("mission");

describe("/mission API", () => {
  beforeAll(async () => {
    tenantAgent = await Login();
    superAdminAgent = await LoginSuper();
  });
  afterAll(async () => {
    await Logout(tenantAgent);
    await Logout(superAdminAgent);
  });

  test("POST /create", async () => {
    await createMission(tenantAgent, superAdminAgent);
  });

  test("POST /mission-by-userid", async () => {
    await createMission(tenantAgent, superAdminAgent);

    const res = await tenantAgent
      .post(full_url("mission-by-userid"))
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: expect.any(Array),
    });
  });

  test("GET /get/tenant", async () => {
    const { mission } = await createMission(tenantAgent, superAdminAgent);

    const res = await tenantAgent
      .get(full_url("get/tenant"))
      .query({
        name: mission.name.slice(null, 4),
        filter: "all",
        missionType: mission.missionType,
        client: "true",
        sort: "createdAt:descend",
        page: "1",
        limit: "10",
        // searchFilters: "" // Didn't understand format properly
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: expect.any(Array),
    });
  });

  test("GET /get/user/:id", async () => {
    const { mission } = await createMission(tenantAgent, superAdminAgent);

    const res = await tenantAgent
      .get(full_url(`get/user/${mission.user}`))
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: expect.any(Array),
    });
  });

  test("GET /get/:id", async () => {
    const { mission } = await createMission(tenantAgent, superAdminAgent);

    const res = await tenantAgent
      .get(full_url(`get/${mission._id}`))
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: expect.any(Object),
    });
  });

  test("GET /filtered-mission", async () => {
    await createMission(tenantAgent, superAdminAgent);

    const res = await tenantAgent
      .get(full_url("filtered-mission"))
      .query({
        status: "All",
        date: "2022-09-15",
        // startDate: "2022-09-10",
        // endDate: "2022-09-20",
        page: "1",
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      totalPages: expect.any(Number),
      data: expect.any(Array),
    });
  });

  test("GET /autocomplete", async () => {
    await createMission(tenantAgent, superAdminAgent);

    const res = await tenantAgent
      .get(full_url("autocomplete"))
      .query({
        query: "mission",
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: expect.any(Array),
    });
  });

  test("GET /get-total-number-of-mission-by-locationID", async () => {
    const { flight } = await createMission(tenantAgent, superAdminAgent);

    const res = await tenantAgent
      .get(full_url("get-total-number-of-mission-by-locationID"))
      .query({
        id: flight.locationID,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: expect.any(Number),
    });
  });

  test("GET /get-missions-by-location-mapref", async () => {
    const { flight } = await createMission(tenantAgent, superAdminAgent);

    const res = await tenantAgent
      .get(full_url("get-missions-by-location-mapref"))
      .query({
        id: flight.locationID,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: expect.any(Array),
    });
  });

  test("GET /get-missions-by-locationID", async () => {
    const { mission, flight } = await createMission(tenantAgent, superAdminAgent);

    const res = await tenantAgent
      .get(full_url("get-missions-by-locationID"))
      .query({
        missionID: mission._id,
        locationID: flight.locationID,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: expect.any(Array),
    });
  });

  test("GET /get-mission-csv-for-tenant-Or-user", async () => {
    const { mission } = await createMission(tenantAgent, superAdminAgent);

    const res = await tenantAgent
      .get(full_url("get-mission-csv-for-tenant-Or-user"))
      .send({
        userId: mission.user,
        status: mission.status,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      pathh: expect.any(String),
    });
  });

  test("GET /memory-usage/:id", async () => {
    const { mission } = await createMission(tenantAgent, superAdminAgent);

    const res = await tenantAgent
      .get(full_url(`memory-usage/${mission._id}`))
      .query({
        missionId: mission._id,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: expect.any(Array),
    });
  });

  test("POST /edit", async () => {
    const { mission } = await createMission(tenantAgent, superAdminAgent);
    const missionType = await createMissionType(superAdminAgent);

    const res = await tenantAgent
      .post(full_url("edit"))
      .send({
        id: mission._id,
        name: faker.random.words(2),
        description: faker.random.words(3),
        deliverables: [faker.random.word()],
        type: missionType._id,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: expect.any(Object),
    });
  });

  test("PATCH /update-status", async () => {
    const { mission } = await createMission(tenantAgent, superAdminAgent);

    const res = await tenantAgent
      .patch(full_url("update-status"))
      .send({
        missionID: mission._id,
        status: "Completed",
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
    });
  });

  test("POST /insert-missiontype-by-Id", async () => {
    const { mission } = await createMission(tenantAgent, superAdminAgent);
    const missionType = await createMissionType(superAdminAgent);

    const res = await tenantAgent
      .post(full_url("insert-missiontype-by-Id"))
      .send({
        id: mission._id,
        missionType: missionType._id,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
    });
  });

  test("POST /delete", async () => {
    const { mission } = await createMission(tenantAgent, superAdminAgent);

    const res = await tenantAgent
      .post(full_url("delete"))
      .send({
        _id: mission._id,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: expect.any(Object),
    });
  });
});
