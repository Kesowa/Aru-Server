import { SuperAgentTest } from "supertest";
import { CurriedUrl } from "./utils";
import { createUser } from "./user";
import { faker } from "@faker-js/faker";
import { createModel } from "./model";
import { createManufacturer } from "./manufacturer";

const full_url = CurriedUrl("asset");

export async function createAsset(tenantAgent: SuperAgentTest, superAdminAgent: SuperAgentTest) {
  const user = await createUser(tenantAgent);
  const owner = await createUser(tenantAgent);
  const model = await createModel(tenantAgent, superAdminAgent);
  const manufacturer = await createManufacturer(tenantAgent);
  const res = await tenantAgent
    .post(full_url("create"))
    .send({
      assetName: faker.company.name() + " Drone",
      userID: user._id,
      assetInfo: [{ UIN: faker.random.numeric(7), serialNo: faker.random.numeric(7) }],
      model: model._id,
      assetOwner: owner._id,
      manufactureDate: "2021-10-04",
      manufactureID: manufacturer._id,
    })
    .expect(201);

  expect(res.body).toMatchObject({
    status: true,
    message: expect.any(String),
    data: expect.any(Object),
  });

  return res.body.data;
}
