import { SuperAgentTest } from "supertest";
import { CurriedUrl } from "./utils";
import { faker } from "@faker-js/faker";
import { createAsset } from "./asset";
import { createLocation } from "./location";
import { createMissionType } from "./missionType";
import { createClient } from "./client";

const full_url = CurriedUrl("mission");

export async function createMission(tenantAgent: SuperAgentTest, superAdminAgent: SuperAgentTest) {
  const missionType = await createMissionType(superAdminAgent);
  const asset = await createAsset(tenantAgent, superAdminAgent);
  const location = await createLocation(tenantAgent);
  const client = await createClient(tenantAgent);
  const address = faker.address.streetAddress();
  const res = await tenantAgent
    .post(full_url("create"))
    .send({
      name: faker.random.words(2),
      description: faker.random.words(3),
      deliverables: Array(3).map(() => faker.random.word()),
      assetId: asset._id,
      flights: [
        {
          flightDetails: {
            locationId: location._id,
            flightName: address,
            date: "2022-09-15",
            time: "05:30:00 PM",
            duration: "1hr",
            centerPoints: {
              lat: 22.55,
              lng: 88.48,
            },
            geoLocation: address,
          },
        },
      ],
      missionType: missionType._id,
      clientId: [ client._id ],
    })
    .expect(201);

  expect(res.body).toMatchObject({
    status: true,
    message: expect.any(String),
    data: {
        mission: expect.any(Object),
        flight: expect.any(Object),
    },
  });

  const { mission, flight } = res.body.data;

  return { mission, flight };
}
