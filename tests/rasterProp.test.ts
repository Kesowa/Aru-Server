import { CurriedUrl, Login, Logout } from "./utils/utils";
import {SuperAgentTest} from "supertest";
let agent: SuperAgentTest;

beforeAll(async () => (agent = await Login()));
afterAll(async () => Logout(agent));
const full_url = CurriedUrl("rasterProp");

describe("/rasterProp API", () => {
  test("POST /create", async () => {
    const res = await agent
      .post(full_url("create"))
      .send({
        name: "ORTHO",
        bidx: Math.floor(Math.random() * 10),
        bandExp: Math.floor(Math.random() * 1000),
        colorMap: "RGB",
        resamplingMethod: "abcdefg",
      })
      .expect(201);

    console.log(res.body);

    expect(res.body).toMatchObject({
      status: true,
      message: "New rasterProps Created",
      data: expect.any(Object),
    });
  });

  test("GET /get-by-ID", async () => {
    const created_props: string[] = [];
    {
      const res = await agent
        .post(full_url("create"))
        .send({
          name: "ORTHO",
          bidx: Math.floor(Math.random() * 10),
          bandExp: Math.floor(Math.random() * 1000),
          colorMap: "RGB",
          resamplingMethod: "abcdefg",
        })
        .expect(201);
      created_props.push(res.body.data._id);
    }

    const res = await agent
      .get(full_url("get-by-ID"))
      .query({
        id: created_props[0],
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "fetch raster data successfully",
      result: expect.any(Object),
    });
  });

  test("GET /get-all-rasterProps", async () => {
    await agent
      .post(full_url("create"))
      .send({
        name: "ORTHO",
        bidx: Math.floor(Math.random() * 10),
        bandExp: Math.floor(Math.random() * 1000),
        colorMap: "RGB",
        resamplingMethod: "abcdefg",
      })
      .expect(201);

    const res = await agent
      .get(full_url("get-all-rasterProps"))
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "raster data fetched successfully",
      data: expect.any(Array),
    });
  });
});
