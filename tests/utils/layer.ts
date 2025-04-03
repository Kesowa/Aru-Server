import { SuperAgentTest } from "supertest";
import { CurriedUrl } from "./utils";
import { uploadFile } from "./upload";
import { faker } from "@faker-js/faker";

const full_url = CurriedUrl("layer");

const sampleGeojsonData = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {
        description: "Small geojson",
        color: "#000000",
        icon: "MarkerIcon",
        sys_id: "62e4af5f4577d66eff23d778",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            {
              lng: 88.47412616159087,
              lat: 22.576572985349607,
            },
            {
              lng: 88.47393132628888,
              lat: 22.57600845615178,
            },
            {
              lng: 88.47422357924162,
              lat: 22.57593711438538,
            },
            {
              lng: 88.47440161839664,
              lat: 22.576476829440843,
            },
            {
              lng: 88.47412616159087,
              lat: 22.576572985349607,
            },
          ],
        ],
      },
    },
  ],
};

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

export async function createVectorLayer(agent: SuperAgentTest) {
  const res = await agent
    .post(full_url("create-vector-layer"))
    .send({
      name: faker.address.street(),
      missionId: "61f3b1e65f915a05cb8885ec",
      vectorId: "60c3a13fca0cbe039fce0d4f",
      geoJSON: sampleGeojsonData,
    })
    .expect(201);

  expect(res.body).toMatchObject({
    status: true,
    message: expect.any(String),
    data: expect.any(Object),
  });

  return res.body.data;
}
