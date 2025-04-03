import { SuperAgentTest } from "supertest";
import { CurriedUrl } from "./utils";
import { uploadFile } from "./upload";
import { faker } from "@faker-js/faker";

const full_url = CurriedUrl("layer");

export async function createLayer(agent: SuperAgentTest) {
  const fileId = await uploadFile(agent, "./assets/poles.geojson");
  const res = await agent
    .post(full_url("create/Vector"))
    .send({
      name: faker.address.street(),
      type: "Vector",
      vector: "Electric Pole",
      captureDate: "2022-07-29",
      inHeritOriginalColorFromFile: "false",
      missionId: "61f3b1e65f915a05cb8885ec", // !TODO create mission for this
      color: "#000000",
      icon: "MarkerIcon",
      file: fileId
    })
    .expect(201);

  expect(res.body).toMatchObject({
    status: true,
    message: expect.any(String),
    data: expect.any(Object),
  });

  return res.body.data;
}


export async function createRasterLayer(agent: SuperAgentTest) {
  const fileId = await uploadFile(agent, "./assets/Ortho_25cm.tif");
  const res = await agent
    .post(full_url("create/Raster"))
    .send({
      name: faker.address.city(),
      type: "Raster",
      raster: "ORTHO",
      captureDate: "2022-07-29",
      file: fileId,
      missionId: "61f3b1e65f915a05cb8885ec", // !TODO create mission for this
    })
    .expect(201);

  expect(res.body).toMatchObject({
    status: true,
    message: expect.any(String),
    data: expect.any(Object),
  });

  return res.body.data;
}
