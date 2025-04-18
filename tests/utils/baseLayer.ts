import { SuperAgentTest } from "supertest";
import { CurriedUrl } from "./utils";
import { uploadFile } from "./upload";
import { faker } from "@faker-js/faker";

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

const full_url = CurriedUrl("baselayer");

export async function createLayer(agent: SuperAgentTest): Promise<{ layer: Record<string, any>, properties: Record<string, any> }> {
  const fileId = await uploadFile(agent, "./assets/poles.geojson");
  const res = await agent
    .post(full_url("create/Vector"))
    .send({
      name: Date(),
      type: "Vector",
      vector: "Electric Pole",
      captureDate: "2022-07-29",
      inHeritOriginalColorFromFile: "false",
      color: "#000000",
      icon: "Icon",
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
    .post(full_url("create-base-raster-upload/Raster"))
    .send({
      name: faker.address.city(),
      type: "Raster",
      raster: "ORTHO",
      captureDate: "2022-07-29",
      file: fileId,
    })
    .expect(201);

  expect(res.body).toMatchObject({
    status: true,
    message: expect.any(String),
    data: expect.any(Object),
  });

  return res.body.data;
}

export async function createBaseVectorLayer(agent: SuperAgentTest) {
  const res = await agent
    .post(full_url("create-base-vector-layer"))
    .send({
      name: faker.address.street(),
      vectorType: "Zone Boundary",
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

