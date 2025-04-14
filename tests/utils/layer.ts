import { SuperAgentTest } from "supertest";
import { CurriedUrl } from "./utils";
import { uploadFile } from "./upload";
import { faker } from "@faker-js/faker";
import { createMission } from "./mission";

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
            [
              88.47412616159087,
              22.576572985349607,
            ],
            [
              88.47393132628888,
              22.57600845615178,
            ],
            [
              88.47422357924162,
              22.57593711438538,
            ],
            [
              88.47440161839664,
              22.576476829440843,
            ],
            [
              88.47412616159087,
              22.576572985349607,
            ],
          ],
        ],
      },
    },
  ],
};

export async function createLayer(
  agent: SuperAgentTest, 
  superAdminAgent: SuperAgentTest, 
  missionId?:string, 
  vector?: string,
  filePath?: string,
) {
  let mission: any;
  if (!missionId) {
    const { mission: m } = await createMission(agent, superAdminAgent);
    mission = m;
  }
  const fileId = await uploadFile(agent, filePath ?? "./assets/poles.geojson");
  const res = await agent
    .post(full_url("create/Vector"))
    .send({
      name: faker.address.street(),
      type: "Vector",
      vector: vector ?? "Electric Pole",
      captureDate: "2022-07-29",
      inHeritOriginalColorFromFile: "false",
      missionId: missionId ?? mission._id,
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


export async function createRasterLayer(
  agent: SuperAgentTest, 
  superAdminAgent: SuperAgentTest, 
  missionId?:string, 
  raster?: string,
  filePath?: string,
) {
  let mission: any;
  if (!missionId) {
    const { mission: m } = await createMission(agent, superAdminAgent);
    mission = m;
  }
  const fileId = await uploadFile(agent, filePath ?? "./assets/Ortho_25cm.tif");
  const res = await agent
    .post(full_url("create/Raster"))
    .send({
      name: faker.address.city(),
      type: "Raster",
      raster: raster ?? "ORTHO",
      captureDate: "2022-07-29",
      file: fileId,
      missionId: missionId ?? mission._id,
    })
    .expect(201);

  expect(res.body).toMatchObject({
    status: true,
    message: expect.any(String),
    data: expect.any(Object),
  });

  return res.body.data;
}

export async function createVectorLayer(agent: SuperAgentTest, superAdminAgent: SuperAgentTest) {
  const { mission } = await createMission(agent, superAdminAgent);
  const res = await agent
    .post(full_url("create-vector-layer"))
    .send({
      name: faker.address.street(),
      missionId: mission._id,
      vectorType: "Area Boundary",
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
