import { CurriedUrl, Login, Logout } from "./utils/utils";
import { SuperAgentTest } from "supertest";
import { randomUUID } from "crypto";
import { createBaseVectorLayer, createLayer, createRasterLayer } from "./utils/layer";
import { uploadFile } from "./utils/upload";

let agent: SuperAgentTest;

beforeAll(async () => { agent = await Login(); });
afterAll(async () => await Logout(agent));
const full_url = CurriedUrl("baselayer");

describe("/baselayer API", () => {
  test("POST /create/Vector", async () => {
    await createLayer(agent);
  });

  test("POST /create-by-layers", async () => {
    const layers = [await createLayer(agent), await createLayer(agent)];
    const res = await agent
      .post(full_url("create-by-layers"))
      .send({
        name: "base-test-2",
        pattr: [],
        layers: [
          {
            layerId: layers[0]._id,
            attrMapping: {
              AA: "AA",
            },
          },
          {
            layerId: layers[1]._id,
            attrMapping: {
              AA: "AA",
            },
          },
        ],
        vectorTypeId: "60c3a13fca0cbe039fce0d4f",
      })
      .expect(201);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: {
        _id: expect.any(String),
      },
    });
  });

  test("POST /create-base-vector-layer", async () => {
    await createBaseVectorLayer(agent);
  });

  test("GET /fetch/All", async () => {
    await createLayer(agent);
    const res = await agent
      .get(full_url("fetch/All"))
      .expect(200);

    expect(res.body).toMatchObject({
      success: true,
      message: expect.any(String),
      data: expect.any(Array),
    });

    const res2 = await agent
      .get(full_url("/fetch/Vector"))
      .expect(200);

    expect(res2.body).toMatchObject({
      success: true,
      message: expect.any(String),
      data: expect.any(Array),
    });
  });

  test("POST /filter-base-layer", async () => {
    await createLayer(agent);
    const res = await agent
      .post(full_url("filter-base-layer"))
      .send({
        captureDate: "desc",
        time: "2 days",
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: expect.any(Array),
    });
  });

  test("PATCH /publishBaseLayer", async () => {
    const layer = await createLayer(agent);
    const res = await agent
      .patch(full_url("publishBaseLayer"))
      .send({
        layerId: [layer._id],
      })
      .expect(200);
    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      publicMapRef: expect.any(String),
      data: expect.any(Object),
    });
  });

  test("GET /getallpublicbaselayers", async () => {
    const res = await agent
      .get(full_url("getallpublicbaselayers"))
      .query({
        mapRef: "5f204f03b9445726102781a862148702831c465d972286b3",
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: expect.any(Array),
    });
  });

  test("GET /searchPublicLayer", async () => {
    const res = await agent
      .get(full_url("searchPublicLayer"))
      .query({
        mapRef: "5f204f03b9445726102781a862148702831c465d972286b3",
        key: "color",
        value: "#000000",
      })
      .expect(200);
    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      layerId: expect.any(String),
      data: expect.any(Array),
    });
  });

  test("PUT /set-prime-attr", async () => {
    const layer = await createLayer(agent);
    const res = await agent
      .put(full_url("set-prime-attr"))
      .send({
        path: layer.layerpath,
        pattr: ["Zip_Code"],
        id: layer._id,
      })
      .expect(200);
    expect(res.body).toMatchObject({
      success: true,
      message: expect.any(String),
      data: expect.any(Object),
    });
  });

  // test("PATCH /updateisBase", async () => {
  //   const res = await agent
  //     .patch(full_url("updateisBase"))
  //     .expect(200);
  //   expect(res.body).toMatchObject({
  //     status: true,
  //     message: "All layer documents modified",
  //   });
  // });

  // test("PATCH /updateisPublic", async () => {
  //   const res = await agent
  //     .patch(full_url("updateisPublic"))
  //     .expect(200);
  //   expect(res.body).toMatchObject({
  //     status: true,
  //     message: "All layer documents modified",
  //   });
  // });

  test("PATCH /update-by-layers", async () => {
    const base_layer = await createBaseVectorLayer(agent);

    const res = await agent
      .patch(full_url("update-by-layers"))
      .send({
        layers: [
          {
            layerId: "61e7b5ab7f65140b304f4842",
            attrMapping: { AA: "AA" },
          },
        ],
        baseLayer: base_layer._id,
      })
      .expect(200);
    expect(res.body).toMatchObject({
      success: true,
      message: expect.any(String),
      data: expect.any(Object),
    });
  });

  test("POST /upload-to-update-base-layer/Vector", async () => {
    const base_layer = await createBaseVectorLayer(agent);

    const res = await agent
      .post(full_url("upload-to-update-base-layer/Vector"))
      .field("baseLayer", base_layer._id)
      .attach("file", "./assets/sampleData.geojson")
      .expect(200);
    expect(res.body).toMatchObject({
      success: true,
      data: {
        primeAttributes: expect.any(Array),
        layerAttributes: expect.any(Array),
        filePath: expect.any(String),
        baseLayer: base_layer,
      },
    });
  });

  test("PATCH /get-meta-data", async () => {
    const res = await agent
      .patch(full_url("get-meta-data"))
      .send({
        layers: ["61e7b5ab7f65140b304f4842"],
      })
      .expect(200);
    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: expect.any(Array),
    });
  });

  // needs /vector/1659511470073_solar.geojson to exist
  test("PATCH /get-meta-data-for-update", async () => {
    const base_layer = await createBaseVectorLayer(agent);
    const res = await agent
      .patch(full_url("get-meta-data-for-update"))
      .send({
        layers: ["61e7b5ab7f65140b304f4842"],
        baseLayer: base_layer._id,
      })
      .expect(200);
    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: expect.any(Object),
    });
  });

  test("PATCH /update-base-layer-by-uploaded-layer", async () => {
    const layer = await createLayer(agent);
    const res = await agent
      .patch(full_url("update-base-layer-by-uploaded-layer"))
      .send({
        filePath: "public" + layer.layerpath,
        baseLayer: layer.id,
        attrMapping: {
          AA: "AA",
        },
      })
      .expect(200);
    expect(res.body).toMatchObject({
      success: true,
      message: expect.any(String),
      data: expect.any(Object),
    });
  });

  test("POST /create-base-raster-upload/Raster", async () => {
    await createRasterLayer(agent);
  }, 15000);

  // !TODO: Need to fix this dependency on mission data
  test("POST /create-base-raster-import-mission", async () => {
    const res = await agent
      .post(full_url("create-base-raster-import-mission"))
      .send({
        name: randomUUID(),
        layers: ["61eb92375f7a012bcdbbfb2a"],
        captureDate: "2022-07-28",
      })
      .expect(201);

    expect(res.body).toMatchObject({
      status: true,
      message: "New Base Layer Created Successfully",
      data: expect.any(Object),
    });
  }, 15000);

  test("PATCH /updateRasterLayerUpload/Raster", async () => {
    const base_layer = await createRasterLayer(agent);
    const fileId = await uploadFile(agent, "./assets/Ortho_25cm.tif");
    const res = await agent
      .patch(full_url("updateRasterLayerUpload/Raster"))
      .send({
        layerId: base_layer._id,
        file: fileId,
      })
      .expect(200);
    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: expect.any(Object),
    });
  }, 15000);

  test("PATCH /updateRasterLayerImport", async () => {
    const base_layer = await createRasterLayer(agent);
    const layers = [await createRasterLayer(agent), await createRasterLayer(agent)];
    const res = await agent
      .patch(full_url("updateRasterLayerImport"))
      .send({
        layerId: base_layer,
        layers: layers,
      })
      .expect(200);
    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: expect.any(Object),
    });
  }, 15000);

  test("DELETE /delete-baseLayer-id", async () => {
    const base_layer = await createLayer(agent);
    const res = await agent
      .delete(full_url("delete-baseLayer-id"))
      .send({
        layers: [base_layer._id],
      })
      .expect(200);
    expect(res.body).toMatchObject({
      status: true,
      message: "Base successfully deleted",
    });
  });
});
