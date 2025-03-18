import { CurriedUrl, Login, Logout } from "./utils/utils";
import {SuperAgentTest} from "supertest";
import { randomUUID } from "crypto";

let agent: SuperAgentTest;

beforeAll(async () => {
  agent = await Login();
  afterAll(async () => await Logout(agent));
});
const full_url = CurriedUrl("baselayer");

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

describe("/baselayer API", () => {
  const created_layers: any[] = [];
  test("POST /create/Vector", async () => {
    const res = await agent
      .post(full_url("create/Vector"))
      .field("name", Date())
      .field("type", "Vector")
      .field("vector", "60c3a13fca0cbe039fce0d4f")
      .field("captureDate", "2022-07-29")
      .field("inHeritOriginalColorFromFile", "false")
      .field("color", "#000000")
      .field("icon", "")
      .attach("file", "./assets/poles.geojson")
      .expect(201);

    expect(res.body).toMatchObject({
      status: true,
      message: "New Layer Created",
      data: expect.any(Object),
    });
    created_layers.push(res.body.data.layer);
  });

  test("POST /create-by-layers", async () => {
    {
      const res = await agent
        .post(full_url("create/Vector"))
        .field("name", Date())
        .field("type", "Vector")
        .field("vector", "60c3a13fca0cbe039fce0d4f")
        .field("captureDate", "2022-07-29")
        .field("inHeritOriginalColorFromFile", "false")
        .field("color", "#00ff00")
        .field("icon", "")
        .attach("file", "./assets/solar.geojson")
        .expect(201);
      created_layers.push(res.body.data.layer);
    }
    const res = await agent
      .post(full_url("create-by-layers"))
      .send({
        name: "base-test-2",
        pattr: [],
        layers: [
          {
            layerId: created_layers[0]._id,
            attrMapping: {
              AA: "AA",
            },
          },
          {
            layerId: created_layers[1]._id,
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
      message: "Sucessfully created base layer",
      data: {
        _id: expect.any(String),
      },
    });
  });

  test("POST /create-base-vector-layer", async () => {
    const res = await agent
      .post(full_url("create-base-vector-layer"))
      .send({
        name: "base-test-3",
        vectorId: "60c3a13fca0cbe039fce0d4f",
        geoJSON: sampleGeojsonData,
      })
      .expect(201);

    expect(res.body).toMatchObject({
      status: true,
      message: "Sucessfully created base vector layer",
      data: expect.any(Object),
    });
    created_layers.push(res.body.data.layer);
  });

  test("GET /fetch/All", async () => {
    {
      const res = await agent
        .post(full_url("create/Vector"))
        .field("name", Date())
        .field("type", "Vector")
        .field("vector", "60c3a13fca0cbe039fce0d4f")
        .field("captureDate", "2022-07-29")
        .field("inHeritOriginalColorFromFile", "false")
        .field("color", "#000000")
        .field("icon", "")
        .attach("file", "./assets/poles.geojson")
        .expect(201);
      created_layers.push(res.body.data.layer);
    }
    const res = await agent
      .get(full_url("fetch/All"))
      .expect(200);

    expect(res.body).toMatchObject({
      success: true,
      message: "BaseLayers fetched successfully",
      data: expect.any(Array),
    });

    const res2 = await agent
      .get(full_url("/fetch/Vector"))
      .expect(200);

    expect(res2.body).toMatchObject({
      success: true,
      message: "BaseLayers fetched successfully",
      data: expect.any(Array),
    });
  });

  test("POST /filter-base-layer", async () => {
    {
      const res = await agent
        .post(full_url("create/Vector"))
        .field("name", Date())
        .field("type", "Vector")
        .field("vector", "60c3a13fca0cbe039fce0d4f")
        .field("captureDate", "2022-07-29")
        .field("inHeritOriginalColorFromFile", "false")
        .field("color", "#000000")
        .field("icon", "")
        .attach("file", "./assets/poles.geojson")
        .expect(201);
      created_layers.push(res.body.data.layer);
    }
    const res = await agent
      .post(full_url("filter-base-layer"))
      .send({
        captureDate: "desc",
        time: "2 days",
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Sucessfully get Vector or Raster data ",
      data: expect.any(Array),
    });
  });

  test("PATCH /publishBaseLayer", async () => {
    {
      const res = await agent
        .post(full_url("create/Vector"))
        .field("name", Date())
        .field("type", "Vector")
        .field("vector", "60c3a13fca0cbe039fce0d4f")
        .field("captureDate", "2022-07-29")
        .field("inHeritOriginalColorFromFile", "false")
        .field("color", "#00ff00")
        .field("icon", "")
        .attach("file", "./assets/solar.geojson")
        .expect(201);
      created_layers.push(res.body.data.layer);
    }
    const res = await agent
      .patch(full_url("publishBaseLayer"))
      .send({
        layerId: [created_layers[0]._id],
      })
      .expect(200);
    expect(res.body).toMatchObject({
      status: true,
      message: "Layer: " + created_layers[0]._id + " has been made public",
      publicMapRef: expect.any(String),
      data: expect.any(Object),
    });
  });

  test("GET /getallpublicbaselayers", async () => {
    {
      const res = await agent
        .post(full_url("create/Vector"))
        .field("name", Date())
        .field("type", "Vector")
        .field("vector", "60c3a13fca0cbe039fce0d4f")
        .field("captureDate", "2022-07-29")
        .field("inHeritOriginalColorFromFile", "false")
        .field("color", "#000000")
        .field("icon", "")
        .attach("file", "./assets/poles.geojson")
        .expect(201);
      created_layers.push(res.body.data.layer);
    }
    const res = await agent
      .get(full_url("getallpublicbaselayers"))
      .query({
        mapRef: "5f204f03b9445726102781a862148702831c465d972286b3",
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Fetched all public base layers",
      data: expect.any(Array),
    });
  });

  test("GET /searchPublicLayer", async () => {
    {
      const res = await agent
        .post(full_url("create/Vector"))
        .field("name", Date())
        .field("type", "Vector")
        .field("vector", "60c3a13fca0cbe039fce0d4f")
        .field("captureDate", "2022-07-29")
        .field("inHeritOriginalColorFromFile", "false")
        .field("color", "#000000")
        .field("icon", "")
        .attach("file", "./assets/poles.geojson")
        .expect(201);
      created_layers.push(res.body.data.layer);
    }
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
      message: "Match found",
      layerId: expect.any(String),
      data: expect.any(Array),
    });
  });

  test("PUT /set-prime-attr", async () => {
    {
      const res = await agent
        .post(full_url("create/Vector"))
        .field("name", Date())
        .field("type", "Vector")
        .field("vector", "60c3a13fca0cbe039fce0d4f")
        .field("captureDate", "2022-07-29")
        .field("inHeritOriginalColorFromFile", "false")
        .field("color", "#000000")
        .field("icon", "")
        .attach("file", "./assets/poles.geojson")
        .expect(201);
      created_layers.push(res.body.data.layer);
    }
    const res = await agent
      .put(full_url("set-prime-attr"))
      .send({
        path: created_layers[0].layerpath,
        pattr: ["Zip_Code"],
        id: created_layers[0]._id,
      })
      .expect(200);
    expect(res.body).toMatchObject({
      success: true,
      message: "Prime attributes added successfully",
      data: expect.any(Object),
    });
  });

  test("PATCH /updateisBase", async () => {
    const res = await agent
      .patch(full_url("updateisBase"))
      .expect(200);
    expect(res.body).toMatchObject({
      status: true,
      message: "All layer documents modified",
    });
  });

  test("PATCH /updateisPublic", async () => {
    const res = await agent
      .patch(full_url("updateisPublic"))
      .expect(200);
    expect(res.body).toMatchObject({
      status: true,
      message: "All layer documents modified",
    });
  });

  test("PATCH /update-by-layers", async () => {
    let base_layer: string = "";
    {
      const res = await agent
        .post(full_url("create-base-vector-layer"))
        .send({
          name: "base-test-3",
          vectorId: "60c3a3c5ca0cbe039fce0d64",
          geoJSON: sampleGeojsonData,
        })
        .expect(201);
      expect(res.body.data._id).toBeDefined();
      base_layer = res.body.data._id;
    }

    const res = await agent
      .patch(full_url("update-by-layers"))
      .send({
        layers: [
          {
            layerId: "61e7b5ab7f65140b304f4842",
            attrMapping: { AA: "AA" },
          },
        ],
        baseLayer: base_layer,
      })
      .expect(200);
    expect(res.body).toMatchObject({
      success: true,
      message: "Layer updated successfully",
      data: expect.any(Object),
    });
  });

  test("POST /upload-to-update-base-layer/Vector", async () => {
    let base_layer: string = "";
    {
      const res = await agent
        .post(full_url("create-base-vector-layer"))
        .send({
          name: randomUUID(),
          vectorId: "60c3a3c5ca0cbe039fce0d64",
          geoJSON: sampleGeojsonData,
        })
        .expect(201);
      expect(res.body.data._id).toBeDefined();
      base_layer = res.body.data._id;
    }

    const res = await agent
      .post(full_url("upload-to-update-base-layer/Vector"))
      .field("baseLayer", base_layer)
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
      message: "got the right stuff",
      data: expect.any(Array),
    });
  });

  // needs /vector/1659511470073_solar.geojson to exist
  test("PATCH /get-meta-data-for-update", async () => {
    let base_layer: string = "";
    {
      const res = await agent
        .post(full_url("create-base-vector-layer"))
        .send({
          name: "base-test-3",
          vectorId: "60c3a3c5ca0cbe039fce0d64",
          geoJSON: sampleGeojsonData,
        })
        .expect(201);
      expect(res.body.data._id).toBeDefined();
      base_layer = res.body.data._id;
    }
    const res = await agent
      .patch(full_url("get-meta-data-for-update"))
      .send({
        layers: ["61e7b5ab7f65140b304f4842"],
        baseLayer: base_layer,
      })
      .expect(200);
    expect(res.body).toMatchObject({
      status: true,
      message: "got the data",
      data: expect.any(Object),
    });
  });

  test("PATCH /update-base-layer-by-uploaded-layer", async () => {
    const layer = { layerpath: "", id: "" };
    {
      const res = await agent
        .post(full_url("create/Vector"))
        .field("name", Date())
        .field("type", "Vector")
        .field("vector", "60c3a13fca0cbe039fce0d4f")
        .field("captureDate", "2022-07-29")
        .field("inHeritOriginalColorFromFile", "false")
        .field("color", "#000000")
        .field("icon", "")
        .attach("file", "./assets/poles.geojson")
        .expect(201);
      created_layers.push(res.body.data.layer);
      layer.layerpath = res.body.data.layer.layerpath;
      layer.id = res.body.data.layer._id;
    }
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
      message: "Layer has been updated successfully",
      data: expect.any(Object),
    });
  });

  test("POST /create-base-raster-upload/Raster", async () => {
    const res = await agent
      .post(full_url("create-base-raster-upload/Raster"))
      .field("name", Date())
      .field("type", "Raster")
      .field("raster", "60c3138f4764fb024a3c1a59")
      .field("captureDate", "2022-07-29")
      .attach("file", "./assets/Ortho_25cm.tif")
      .expect(201);

    expect(res.body).toMatchObject({
      status: true,
      message: "New Base Layer Created Successfully",
      data: expect.any(Object),
    });
  }, 15000);
  const created_layer_ids: string[] = [];
  test("POST /create-base-raster-import-mission", async () => {
    {
      const res = await agent
        .post(full_url("create-base-raster-upload/Raster"))
        .field("name", Date())
        .field("type", "Raster")
        .field("raster", "60c3138f4764fb024a3c1a59")
        .field("captureDate", "2022-07-29")
        .attach("file", "./assets/Ortho_25cm.tif")
        .expect(201);
      created_layer_ids.push(res.body.data._id);
    }
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
    created_layers.push(res.body.data);
  }, 15000);

  test("PATCH /updateRasterLayerUpload/Raster", async () => {
    let base_layer = "";
    {
      const res = await agent
        .post(full_url("create-base-raster-upload/Raster"))
        .field("name", Date())
        .field("type", "Raster")
        .field("raster", "60c3138f4764fb024a3c1a59")
        .field("captureDate", "2022-07-29")
        .attach("file", "./assets/Ortho_25cm.tif")
        .expect(201);
      base_layer = res.body.data._id;
      created_layer_ids.push(res.body.data._id);
    }
    const res = await agent
      .patch(full_url("updateRasterLayerUpload/Raster"))
      .field("layerId", base_layer)
      .attach("file", "./assets/Ortho_25cm.tif")
      .expect(200);
    expect(res.body).toMatchObject({
      status: true,
      message: "Raster layer updated sucessfully",
      data: expect.any(Object),
    });
  }, 15000);

  test("PATCH /updateRasterLayerImport", async () => {
    let base_layer = "";
    {
      const res = await agent
        .post(full_url("create-base-raster-upload/Raster"))
        .field("name", Date())
        .field("type", "Raster")
        .field("raster", "60c3138f4764fb024a3c1a59")
        .field("captureDate", "2022-07-29")
        .attach("file", "./assets/Ortho_25cm.tif")
        .expect(201);
      base_layer = res.body.data._id;
    }
    const res = await agent
      .patch(full_url("updateRasterLayerImport"))
      .send({
        layerId: base_layer,
        layers: created_layer_ids,
      })
      .expect(200);
    expect(res.body).toMatchObject({
      status: true,
      message: "Raster layer updated sucessfully",
      data: expect.any(Object),
    });
  }, 15000);

  test("DELETE /delete-baseLayer-id", async () => {
    {
      const res = await agent
        .post(full_url("create/Vector"))
        .field("name", Date())
        .field("type", "Vector")
        .field("vector", "60c3a13fca0cbe039fce0d4f")
        .field("captureDate", "2022-07-29")
        .field("inHeritOriginalColorFromFile", "false")
        .field("color", "#000000")
        .field("icon", "")
        .attach("file", "./assets/poles.geojson")
        .expect(201);
      created_layers.push(res.body.data.layer);
    }
    // const created_ids: string[] = created_layers.map(a => a._id)
    const res = await agent
      .delete(full_url("delete-baseLayer-id"))
      .send({
        layers: [created_layers[0]._id],
      })
      .expect(200);
    expect(res.body).toMatchObject({
      status: true,
      message: "Base successfully deleted",
    });
  });
});
