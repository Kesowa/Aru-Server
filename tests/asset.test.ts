import { CurriedUrl, Login, Logout } from "./utils/utils";
import {SuperAgentTest} from "supertest";

let agent: SuperAgentTest;

beforeAll(async () => (agent = await Login()));
afterAll(async () => await Logout(agent));
const full_url = CurriedUrl("asset");

describe("/asset API", () => {
  const created_assets: any = [];

  test("POST /create", async () => {
    const res = await agent
      .post(full_url("create"))
      .set("userid", "608e7b3ae11f711a34fb0476")
      .send({
        assetName: "New Drone",
        userID: "608e7b3ae11f711a34fb0476",
        assetInfo: [{ UIN: "1234567" }],
        model: "615acf79e5324204d8b97c86",
        assetOwner: "5f12572c3c19462d3673dbe9",
        manufactureDate: "2021-10-04",
        manufactureID: "615acf24e5324204d8b97c84",
      })
      .expect(201);

    expect(res.body).toMatchObject({
      status: true,
      message: "Successfully saved the asset",
      data: expect.any(Object),
    });

    created_assets.push(res.body.data);
  });
  test("GET /get", async () => {
    {
      const res = await agent
        .post(full_url("create"))
        .set("userid", "608e7b3ae11f711a34fb0476")
        .send({
          assetName: "New Drone",
          userID: "608e7b3ae11f711a34fb0476",
          assetInfo: [{ UIN: "1234567" }],
          model: "615acf79e5324204d8b97c86",
          assetOwner: "5f12572c3c19462d3673dbe9",
          manufactureDate: "2021-10-04",
          manufactureID: "615acf24e5324204d8b97c84",
        })
        .expect(201);
      created_assets.push(res.body.data);
    }
    const res = await agent
      .get(full_url("get"))
      .query({
        assetID: created_assets[0]._id,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Asset fetched",
      data: expect.any(Object),
    });
  });
  test("GET /get-all-asset", async () => {
    {
      const res = await agent
        .post(full_url("create"))
        .set("userid", "608e7b3ae11f711a34fb0476")
        .send({
          assetName: "New Drone",
          userID: "608e7b3ae11f711a34fb0476",
          assetInfo: [{ UIN: "1234567" }],
          model: "615acf79e5324204d8b97c86",
          assetOwner: "5f12572c3c19462d3673dbe9",
          manufactureDate: "2021-10-04",
          manufactureID: "615acf24e5324204d8b97c84",
        })
        .expect(201);
      created_assets.push(res.body.data);
    }
    const res = await agent
      .get(full_url("get-all-asset"))
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "All assets fetched",
      data: expect.any(Object),
    });
  });
  test("PATCH /update", async () => {
    {
      const res = await agent
        .post(full_url("create"))
        .set("userid", "608e7b3ae11f711a34fb0476")
        .send({
          assetName: "New Drone",
          userID: "608e7b3ae11f711a34fb0476",
          assetInfo: [{ UIN: "1234567" }],
          model: "615acf79e5324204d8b97c86",
          assetOwner: "5f12572c3c19462d3673dbe9",
          manufactureDate: "2021-10-04",
          manufactureID: "615acf24e5324204d8b97c84",
        })
        .expect(201);
      created_assets.push(res.body.data);
    }
    const res = await agent
      .patch(full_url("update"))
      .send({
        userID: created_assets[0].userID,
        tenantID: created_assets[0].tenantID,
        assetID: created_assets[0]._id,
        assetInfo: [{ UIN: "7654321" }],
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Successfully updated Asset",
      data: expect.any(Object),
    });
  });
  test("PATCH /toggle-asset-status", async () => {
    {
      const res = await agent
        .post(full_url("create"))
        .set("userid", "608e7b3ae11f711a34fb0476")
        .send({
          assetName: "New Drone",
          userID: "608e7b3ae11f711a34fb0476",
          assetInfo: [{ UIN: "1234567" }],
          model: "615acf79e5324204d8b97c86",
          assetOwner: "5f12572c3c19462d3673dbe9",
          manufactureDate: "2021-10-04",
          manufactureID: "615acf24e5324204d8b97c84",
        })
        .expect(201);
      created_assets.push(res.body.data);
    }
    const res = await agent
      .patch(full_url("toggle-asset-status"))
      .send({
        assetID: created_assets[0]._id,
        isActive: "true",
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Sucessfully toggled the asset to true",
      data: expect.any(Object),
    });
  });
  test("DELETE /delete", async () => {
    {
      const res = await agent
        .post(full_url("create"))
        .set("userid", "608e7b3ae11f711a34fb0476")
        .send({
          assetName: "New Drone",
          userID: "608e7b3ae11f711a34fb0476",
          assetInfo: [{ UIN: "1234567" }],
          model: "615acf79e5324204d8b97c86",
          assetOwner: "5f12572c3c19462d3673dbe9",
          manufactureDate: "2021-10-04",
          manufactureID: "615acf24e5324204d8b97c84",
        })
        .expect(201);
      created_assets.push(res.body.data);
    }
    const created_ids: string[] = created_assets.map((a) => a._id);
    const res = await agent
      .delete(full_url("delete"))
      .send({
        assetID: created_ids[0],
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Asset deleted",
      data: expect.any(Object),
    });
  });
});
