import { SuperAgentTest } from "supertest";
import { CurriedUrl } from "./utils";

const full_url = CurriedUrl("assetclass");

export async function createAssetClass(agent: SuperAgentTest) {
  const res = await agent
    .post(full_url("create"))
    .send({
      typeName: "Any name",
      createdAt: "2022-08-01",
    })
    .expect(201);

  expect(res.body).toMatchObject({
    status: true,
    message: expect.any(String),
    data: expect.any(Object),
  });

  return res.body.data;
}
