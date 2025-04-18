import { SuperAgentTest } from "supertest";
import { CurriedUrl } from "./utils";
import { faker } from "@faker-js/faker";
import { createAssetClass } from "./assetclass";
import { createManufacturer } from "./manufacturer";

const full_url = CurriedUrl("model");

export async function createModel(tenantAgent: SuperAgentTest, superAdminAgent: SuperAgentTest) {
  const assetclass = await createAssetClass(superAdminAgent);
  const manufacturer = await createManufacturer(tenantAgent);
  const res = await tenantAgent
    .post(full_url("create"))
    .send({
      modelName: faker.random.words(2),
      modelNumber: faker.random.numeric(5),
      assetClassID: assetclass._id,
      dimensions: {
        length: faker.random.numeric(1),
        breadth: faker.random.numeric(1),
        height: faker.random.numeric(1),
      },
      manufacturerID: manufacturer._id,
      website: faker.internet.url(),
      props: {
        payloads: faker.random.word(),
      },
    })
    .expect(201);

  expect(res.body).toMatchObject({
    status: true,
    message: expect.any(String),
    data: expect.any(Object),
  });

  return res.body.data;
}
