import { CurriedUrl, Login } from "../config/utils";
import request from "supertest";
import app from "../src/app";
let token: string;
beforeAll(async () => (token = await Login()));
const full_url = CurriedUrl("rasterProp");

describe("/rasterProp API", () => {
  test("POST /create", async () => {
    const res = await request(app)
      .post(full_url("create"))
      .set("Authorization", `Bearer ${token}`)
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
      const res = await request(app)
        .post(full_url("create"))
        .set("Authorization", `Bearer ${token}`)
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

    const res = await request(app)
      .get(full_url("get-by-ID"))
      .set("Authorization", `Bearer ${token}`)
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
    {
      const res = await request(app)
        .post(full_url("create"))
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "ORTHO",
          bidx: Math.floor(Math.random() * 10),
          bandExp: Math.floor(Math.random() * 1000),
          colorMap: "RGB",
          resamplingMethod: "abcdefg",
        })
        .expect(201);
    }

    const res = await request(app)
      .get(full_url("get-all-rasterProps"))
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "raster data fetched successfully",
      data: expect.any(Array),
    });
  });
});
