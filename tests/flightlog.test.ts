import { CurriedUrl, Login, Logout } from "./utils/utils";
import { SuperAgentTest } from "supertest";
import { randomUUID } from "crypto";
import { createFlightLog } from "./utils/flightlog";

let agent: SuperAgentTest;

beforeAll(async () => (agent = await Login()));
afterAll(async () => await Logout(agent));
const full_url = CurriedUrl("flightlog");

const sampleGeoFence = {
  polygon: {
    points: [],
  },
  circle: {
    center: {
      lat: "22.623449382230135",
      lng: "88.38970325095323",
    },
    area: "4793095.287172079",
    radius: "617.6523065529672",
  },
};

describe("/flightlog API", () => {
  test("POST /create", async () => {
    await createFlightLog(agent);
  });

  test("GET /get", async () => {
    const flightlog = await createFlightLog(agent);
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
    const flightlog = await createFlightLog(agent);
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
    const flightlog = await createFlightLog(agent);
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
