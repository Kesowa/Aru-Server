import { SuperAgentTest } from "supertest";
import { CurriedUrl } from "./utils";
import { faker } from "@faker-js/faker";

const full_url = CurriedUrl("flight");

export async function createFlight(agent: SuperAgentTest) {
  const res = await agent
    .post(full_url("create"))
    .send({
      date: new Date(),
      name: faker.address.street(),
      mission: "61f3b1e65f915a05cb8885ec",
      time: "05:30:00 PM",
      duration: "1hr",
    })
    .expect(201);

  expect(res.body).toMatchObject({
    status: true,
    message: expect.any(String),
    data: expect.any(Object),
  });

  return res.body.data;
}

export async function updateFlight(agent: SuperAgentTest, flight: any) {
  const res = await agent
    .post(full_url("edit"))
    .send({
      _id: flight._id,
      name: flight.name,
      date: new Date(),
      time: "06:00:00 PM",
      duration: "2hr",
      locationId: "5f202f03b9225726102721b8",
      centerPoints: {
        lat: 22.55,
        lng: 88.48
      }
    })
    .expect(200);

  expect(res.body).toMatchObject({
    status: true,
    message: expect.any(String),
    data: expect.any(Object),
  });

  return res.body.data;
}
