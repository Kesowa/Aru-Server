import { CurriedUrl, Login, Logout } from "./utils/utils";
import {SuperAgentTest} from "supertest";
import { randomUUID } from "crypto";

let agent: SuperAgentTest;

beforeAll(async () => (agent = await Login()));
afterAll(async () => Logout(agent));
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
    const res = await agent
      .post(full_url("create"))
      .attach("file", "/server/assets/image.png")
      .field("date", Date())
      .field("time", "21:30:30")
      .field("missionID", "61f3b1e65f915a05cb8885ec")
      .field("flightID", "6267dd4b2a2d394080a20849")
      .field("assetID", "610d5eefe16e614280b33476")
      .field("locationID", "6123317cdaacac04cdb2d805")
      .field("duration", "1 hr")
      .field("location", "Main Kolkata")
      .field("pilotName", randomUUID())
      .field("jobType", "Mapping")
      .field("deliverables", JSON.stringify(["Thermal", "Orthomosaic"]))
      .field("geofence", JSON.stringify(sampleGeoFence))
      .expect(201);
    expect(res.body).toMatchObject({
      status: true,
      message: "Sucessfully saved the document",
      data: expect.any(Object),
    });
  });

  test("GET /get", async () => {
    const created_logs: any[] = [];
    {
      const res = await agent
        .post(full_url("create"))
        .attach("file", "/server/assets/image.png")
        .field("date", Date())
        .field("time", "21:30:30")
        .field("missionID", "61f3b1e65f915a05cb8885ec")
        .field("flightID", "6267dd4b2a2d394080a20849")
        .field("assetID", "610d5eefe16e614280b33476")
        .field("locationID", "6123317cdaacac04cdb2d805")
        .field("duration", "1 hr")
        .field("location", "Main Kolkata")
        .field("pilotName", randomUUID())
        .field("jobType", "Mapping")
        .field("deliverables", JSON.stringify(["Thermal", "Orthomosaic"]))
        .field("geofence", JSON.stringify(sampleGeoFence))
        .expect(201);
      created_logs.push(res.body.data);
    }
    const res = await agent
      .get(full_url("get"))
      .query({
        _id: created_logs[0]._id,
      })
      .expect(200);
    expect(res.body).toMatchObject({
      status: true,
      message: "fetched flight logs",
      data: expect.any(Array),
    });
  });

  test("GET /last-flightlog-by-ID", async () => {
    const created_logs: any[] = [];
    {
      const res = await agent
        .post(full_url("create"))
        .attach("file", "/server/assets/image.png")
        .field("date", Date())
        .field("time", "21:30:30")
        .field("missionID", "61f3b1e65f915a05cb8885ec")
        .field("flightID", "6267dd4b2a2d394080a20849")
        .field("assetID", "610d5eefe16e614280b33476")
        .field("locationID", "6123317cdaacac04cdb2d805")
        .field("duration", "1 hr")
        .field("location", "Main Kolkata")
        .field("pilotName", randomUUID())
        .field("jobType", "Mapping")
        .field("deliverables", JSON.stringify(["Thermal", "Orthomosaic"]))
        .field("geofence", JSON.stringify(sampleGeoFence))
        .expect(201);
      created_logs.push(res.body.data);
    }
    const res = await agent
      .get(full_url("last-flightlog-by-ID"))
      .query({
        missionID: created_logs[0].missionID,
        locationID: created_logs[0].locationID,
      })
      .expect(200);
    expect(res.body).toMatchObject({
      status: true,
      message: "fetched flight logs",
      data: expect.any(Object),
    });
  });

  test("GET /last-flightlog-by-location-ID", async () => {
    const created_logs: any[] = [];
    {
      const res = await agent
        .post(full_url("create"))
        .attach("file", "/server/assets/image.png")
        .field("date", Date())
        .field("time", "21:30:30")
        .field("missionID", "61f3b1e65f915a05cb8885ec")
        .field("flightID", "6267dd4b2a2d394080a20849")
        .field("assetID", "610d5eefe16e614280b33476")
        .field("locationID", "6123317cdaacac04cdb2d805")
        .field("duration", "1 hr")
        .field("location", "Main Kolkata")
        .field("pilotName", randomUUID())
        .field("jobType", "Mapping")
        .field("deliverables", JSON.stringify(["Thermal", "Orthomosaic"]))
        .field("geofence", JSON.stringify(sampleGeoFence))
        .expect(201);
      created_logs.push(res.body.data);
    }
    const res = await agent
      .get(full_url("last-flightlog-by-location-ID"))
      .query({
        id: created_logs[0].locationID,
      })
      .expect(200);
    expect(res.body).toMatchObject({
      status: true,
      message: "fetched flight logs",
      data: expect.any(Object),
    });
  });
});
