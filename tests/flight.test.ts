import { CurriedUrl, Login, Logout } from "./utils/utils";
import {SuperAgentTest} from "supertest";
import { randomUUID } from "crypto";

let agent: SuperAgentTest;

beforeAll(async () => (agent = await Login()));
afterAll(async () => Logout(agent));
const full_url = CurriedUrl("flight");

describe("/flight API", () => {
  test("POST /create", async () => {
    const res = await agent
      .post(full_url("create"))
      .send({
        date: new Date().getFullYear() + "-12-12",
        name: randomUUID(),
        mission: "61f3b1e65f915a05cb8885ec",
        time: "05:30:00 PM",
        duration: "1hr",
      })
      .expect(201);

    expect(res.body).toMatchObject({
      status: true,
      message: "New flight created",
      data: expect.any(Object),
    });
  });

  test("POST /edit", async () => {
    let created_flight: any = {};
    {
      const res = await agent
        .post(full_url("create"))
        .send({
          date: new Date().getFullYear() + "-12-12",
          name: randomUUID(),
          mission: "61f3b1e65f915a05cb8885ec",
          time: "05:30:00 PM",
          duration: "1hr",
        })
        .expect(201);
      created_flight = res.body.data;
    }

    const res = await agent
      .post(full_url("edit"))
      .send({
        _id: created_flight._id,
        name: randomUUID(),
        date: new Date().getFullYear() + "-12-11",
        duration: "2hr",
        time: "06:00:00 PM",
        locationId: "6123317cdaacac04cdb2d805",
        centerPoints: {
          lat: 22.55,
          lng: 88.48,
        },
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Flight Edited Successfully",
      data: expect.any(Object),
    });
  });

  test("POST /mission-specific-view", async () => {
    let created_flight: any = {};
    {
      const res = await agent
        .post(full_url("create"))
        .send({
          date: new Date().getFullYear() + "-12-12",
          name: randomUUID(),
          mission: "61f3b1e65f915a05cb8885ec",
          time: "05:30:00 PM",
          duration: "1hr",
        })
        .expect(201);
      created_flight = res.body.data;
    }

    const res = await agent
      .post(full_url("mission-specific-view"))
      .send({
        missionID: created_flight.mission,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Flight fetched sucessfully.",
      data: expect.any(Array),
    });
  });

  test("GET /all-flights", async () => {
    await agent
      .post(full_url("create"))
      .send({
        date: new Date().getFullYear() + "-12-12",
        name: randomUUID(),
        mission: "61f3b1e65f915a05cb8885ec",
        time: "05:30:00 PM",
        duration: "1hr",
      })
      .expect(201);

    const res = await agent
      .get(full_url("all-flights"))
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Here are all the flights",
      data: expect.any(Array),
    });
  });

  test("GET /flightswithoutmission", async () => {
    await agent
      .post(full_url("create"))
      .send({
        date: new Date().getFullYear() + "-12-12",
        name: randomUUID(),
        mission: "61f3b1e65f915a05cb8885ec",
        time: "05:30:00 PM",
        duration: "1hr",
      })
      .expect(201);

    const res = await agent
      .get(full_url("flightswithoutmission"))
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Data fetched successfully",
      data: expect.any(Array),
    });
  });

  test("GET /get-flight-by-location-ID", async () => {
    let created_flight: any = {};
    {
      const res = await agent
        .post(full_url("create"))
        .send({
          date: new Date().getFullYear() + "-12-12",
          name: randomUUID(),
          mission: "61f3b1e65f915a05cb8885ec",
          time: "05:30:00 PM",
          duration: "1hr",
        })
        .expect(201);
      created_flight = res.body.data;

      await agent
        .post(full_url("edit"))
        .send({
          _id: created_flight._id,
          name: randomUUID(),
          date: new Date().getFullYear() + "-12-11",
          duration: "2hr",
          time: "06:00:00 PM",
          locationId: "6123317cdaacac04cdb2d805",
          centerPoints: {
            lat: 22.55,
            lng: 88.48,
          },
        })
        .expect(200);
    }

    const res = await agent
      .get(full_url("get-flight-by-location-ID"))
      .query({
        id: "6123317cdaacac04cdb2d805",
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Flight data fetch successfully",
      data: expect.any(Array),
    });
  });

  test("PATCH /assign-pilot", async () => {
    let created_flight: any = {};
    {
      const res = await agent
        .post(full_url("create"))
        .send({
          date: new Date().getFullYear() + "-12-12",
          name: randomUUID(),
          mission: "61f3b1e65f915a05cb8885ec",
          time: "05:30:00 PM",
          duration: "1hr",
        })
        .expect(201);
      created_flight = res.body.data;
    }

    const res = await agent
      .patch(full_url("assign-pilot"))
      .send({
        flightID: created_flight._id,
        pilotID: "5f12572c3c19462d3673dbe9",
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Successfully assigned pilot",
      data: expect.any(Object),
    });
  });

  test("PATCH /assign-pilot-self", async () => {
    let created_flight: any = {};
    {
      const res = await agent
        .post(full_url("create"))
        .send({
          date: new Date().getFullYear() + "-12-12",
          name: randomUUID(),
          mission: "61f3b1e65f915a05cb8885ec",
          time: "05:30:00 PM",
          duration: "1hr",
        })
        .expect(201);
      created_flight = res.body.data;
    }

    const res = await agent
      .patch(full_url("assign-pilot-self"))
      .send({
        flightID: created_flight._id,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Successfully assigned pilot",
      data: expect.any(Object),
    });
  });

  test("POST /delete", async () => {
    let created_flight: any = {};
    {
      const res = await agent
        .post(full_url("create"))
        .send({
          date: new Date().getFullYear() + "-12-12",
          name: randomUUID(),
          mission: "61f3b1e65f915a05cb8885ec",
          time: "05:30:00 PM",
          duration: "1hr",
        })
        .expect(201);
      created_flight = res.body.data;
    }

    const res = await agent
      .post(full_url("delete"))
      .send({
        _id: created_flight._id,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Flight deleted",
      data: expect.any(Object),
    });
  });
});
