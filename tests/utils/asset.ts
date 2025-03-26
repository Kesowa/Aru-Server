import { SuperAgentTest } from "supertest";
import { CurriedUrl } from "./utils";

const full_url = CurriedUrl("asset");

export async function createAsset(agent: SuperAgentTest) {
  const res = await agent
    .post(full_url("create"))
    .send({
      assetName: "New Drone",
      userID: "608e7b3ae11f711a34fb0476",
      assetInfo: [{ UIN: "1234567", serialNo: "3212312" }],
      model: "615acf79e5324204d8b97c86",
      assetOwner: "5f12572c3c19462d3673dbe9",
      manufactureDate: "2021-10-04",
      manufactureID: "615acf24e5324204d8b97c84",
    })
    .expect(201);

  expect(res.body).toMatchObject({
    status: true,
    message: expect.any(String),
    data: expect.any(Object),
  });

  return res.body.data;
}
