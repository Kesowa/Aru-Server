import { CurriedUrl, Login, Logout } from "./utils/utils";
import {SuperAgentTest} from "supertest";
import { createFlight, updateFlight as updateFlight } from "./utils/flight";

let agent: SuperAgentTest;

beforeAll(async () => (agent = await Login()));
afterAll(async () => await Logout(agent));
const full_url = CurriedUrl("flight");

describe("/flight API", () => {
  test("POST /create", async () => {
    await createFlight(agent);
  });

  test("POST /edit", async () => {
    const flight = await createFlight(agent);
    await updateFlight(agent, flight);
  });

  test("POST /mission-specific-view", async () => {
    const flight = await createFlight(agent);
    const res = await agent
      .post(full_url("mission-specific-view"))
      .send({
        missionID: flight.mission,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: expect.any(Array),
    });
  });

  test("GET /get-flight-by-location-ID", async () => {
    let flight = await createFlight(agent);
    flight = await updateFlight(agent, flight);

    console.log(flight);
    
    const res = await agent
      .get(full_url("get-flight-by-location-ID"))
      .query({
        id: flight.locationID._id,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: expect.any(Array),
    });
  });

  test("PATCH /assign-pilot", async () => {
    const flight = await createFlight(agent);

    const res = await agent
      .patch(full_url("assign-pilot"))
      .send({
        flightID: flight._id,
        pilotID: "5f12572c3c19462d3673dbe9",
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: expect.any(Object),
    });
  });

  test("PATCH /assign-pilot-self", async () => {
    const flight = await createFlight(agent);

    const res = await agent
      .patch(full_url("assign-pilot-self"))
      .send({
        flightID: flight._id,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: expect.any(Object),
    });
  });

  test("POST /delete", async () => {
    const flight = await createFlight(agent);

    const res = await agent
      .post(full_url("delete"))
      .send({
        _id: flight._id,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: expect.any(Object),
    });
  });
});
