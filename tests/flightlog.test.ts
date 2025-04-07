import { CurriedUrl, Login, LoginSuper, Logout } from "./utils/utils";
import { SuperAgentTest } from "supertest";
import { createFlightLog } from "./utils/flightlog";

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
const full_url = CurriedUrl("flightlog");

describe("/flightlog API", () => {
  test("POST /create", async () => {
    await createFlightLog(agent, superAdminAgent);
  });

  test("GET /get", async () => {
    const flightlog = await createFlightLog(agent, superAdminAgent);
    const res = await agent
      .get(full_url("get"))
      .query({
        _id: flightlog._id,
      })
      .expect(200);
    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: expect.any(Array),
    });
  });

  test("GET /last-flightlog-by-ID", async () => {
    const flightlog = await createFlightLog(agent, superAdminAgent);
    const res = await agent
      .get(full_url("last-flightlog-by-ID"))
      .query({
        missionID: flightlog.missionID,
        locationID: flightlog.locationID,
      })
      .expect(200);
    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: expect.any(Object),
    });
  });

  test("GET /last-flightlog-by-location-ID", async () => {
    const flightlog = await createFlightLog(agent, superAdminAgent);
    const res = await agent
      .get(full_url("last-flightlog-by-location-ID"))
      .query({
        id: flightlog.locationID,
      })
      .expect(200);
    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: expect.any(Object),
    });
  });
});
