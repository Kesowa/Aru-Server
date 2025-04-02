import { SuperAgentTest } from "supertest";
import { CurriedUrl } from "./utils";
import { uploadFile } from "./upload";
import { faker } from "@faker-js/faker";

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

export async function createFlightLog(agent: SuperAgentTest) {
  const fileId = await uploadFile(agent, "./assets/image.png");
  const res = await agent
    .post(full_url("create"))
    .send({
      "file":  fileId,
      "date":  new Date(),
      "time":  "09:30:30 PM",
      "missionID":  "61f3b1e65f915a05cb8885ec",
      "flightID":  "6267dd4b2a2d394080a20849",
      "assetID":  "610d5eefe16e614280b33476",
      "locationID":  "6123317cdaacac04cdb2d805",
      "duration":  "1 hr",
      "location":  "Main Kolkata",
      "pilotName": faker.name.fullName(),
      "jobType":  "Mapping",
      "deliverables":  ["Thermal", "Orthomosaic"],
      "geofence":  sampleGeoFence,
      "flightArea": 23.22
    })
    .expect(201);

  expect(res.body).toMatchObject({
    status: true,
    message: expect.any(String),
    data: expect.any(Object),
  });

  return res.body.data;
}
