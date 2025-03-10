import { CurriedUrl, Login } from "../config/utils";
import request from "supertest";
import app from "../src/app";
import { randomUUID } from "crypto";

let token: string;
beforeAll(async () => (token = await Login()));
const full_url = CurriedUrl("flight");

describe("/flight API", () => {
  test("POST /create", async () => {
    const res = await request(app)
      .post(full_url("create"))
      .set("Authorization", `Bearer ${token}`)
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
      const res = await request(app)
        .post(full_url("create"))
        .set("Authorization", `Bearer ${token}`)
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

    const res = await request(app)
      .post(full_url("edit"))
      .set("Authorization", `Bearer ${token}`)
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
      const res = await request(app)
        .post(full_url("create"))
        .set("Authorization", `Bearer ${token}`)
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

    const res = await request(app)
      .post(full_url("mission-specific-view"))
      .set("Authorization", `Bearer ${token}`)
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
    await request(app)
      .post(full_url("create"))
      .set("Authorization", `Bearer ${token}`)
      .send({
        date: new Date().getFullYear() + "-12-12",
        name: randomUUID(),
        mission: "61f3b1e65f915a05cb8885ec",
        time: "05:30:00 PM",
        duration: "1hr",
      })
      .expect(201);

    const res = await request(app)
      .get(full_url("all-flights"))
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Here are all the flights",
      data: expect.any(Array),
    });
  });

  test("GET /flightswithoutmission", async () => {
    await request(app)
      .post(full_url("create"))
      .set("Authorization", `Bearer ${token}`)
      .send({
        date: new Date().getFullYear() + "-12-12",
        name: randomUUID(),
        mission: "61f3b1e65f915a05cb8885ec",
        time: "05:30:00 PM",
        duration: "1hr",
      })
      .expect(201);

    const res = await request(app)
      .get(full_url("flightswithoutmission"))
      .set("Authorization", `Bearer ${token}`)
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
      const res = await request(app)
        .post(full_url("create"))
        .set("Authorization", `Bearer ${token}`)
        .send({
          date: new Date().getFullYear() + "-12-12",
          name: randomUUID(),
          mission: "61f3b1e65f915a05cb8885ec",
          time: "05:30:00 PM",
          duration: "1hr",
        })
        .expect(201);
      created_flight = res.body.data;

      await request(app)
        .post(full_url("edit"))
        .set("Authorization", `Bearer ${token}`)
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

    const res = await request(app)
      .get(full_url("get-flight-by-location-ID"))
      .set("Authorization", `Bearer ${token}`)
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
      const res = await request(app)
        .post(full_url("create"))
        .set("Authorization", `Bearer ${token}`)
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

    const res = await request(app)
      .patch(full_url("assign-pilot"))
      .set("Authorization", `Bearer ${token}`)
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
      const res = await request(app)
        .post(full_url("create"))
        .set("Authorization", `Bearer ${token}`)
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

    const res = await request(app)
      .patch(full_url("assign-pilot-self"))
      .set("Authorization", `Bearer ${token}`)
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
      const res = await request(app)
        .post(full_url("create"))
        .set("Authorization", `Bearer ${token}`)
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

    const res = await request(app)
      .post(full_url("delete"))
      .set("Authorization", `Bearer ${token}`)
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
