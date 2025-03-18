import { CurriedUrl, Login, Logout } from "./utils/utils";
import {SuperAgentTest} from "supertest";
import { randomUUID } from "crypto";

let agent: SuperAgentTest;

beforeAll(async () => {
  agent = await Login();
  afterAll(async () => Logout(agent));
});
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

describe("/layer API", () => {
  test("POST /create/Vector", async () => {
    const res = await agent
      .post(full_url("create/Vector"))
      .attach("file", "/server/assets/poles.geojson")
      .field("name", randomUUID())
      .field("type", "Vector")
      .field("vector", "60c3a3c5ca0cbe039fce0d64")
      .field("captureDate", "2022-08-22T06:54:35.486+00:00")
      .field("missionId", "61f3b1e65f915a05cb8885ec")
      .field("color", "#00FF00")
      .field("icon", "MarkerIcon")
      .field("inHeritOriginalColorFromFile", "false")
      .expect(201);

    expect(res.body).toMatchObject({
      status: true,
      message: "New Layer Created",
      data: expect.any(Object),
    });
  });

  test("POST /create-vector-layer", async () => {
    const res = await agent
      .post(full_url("create-vector-layer"))
      .send({
        name: randomUUID(),
        missionId: "61f3b1e65f915a05cb8885ec",
        vectorId: "60c3a13fca0cbe039fce0d4f",
        geoJSON: sampleGeojsonData,
      })
      .expect(201);

    expect(res.body).toMatchObject({
      status: true,
      message: "Sucessfully created vector layer",
      data: expect.any(Object),
    });
  });

  test("POST /create/Raster", async () => {
    const res = await agent
      .post(full_url("create/Raster"))
      .attach("file", "/server/assets/Ortho_25cm.tif")
      .field("name", randomUUID())
      .field("type", "Raster")
      .field("raster", "60c3138f4764fb024a3c1a59")
      .field("captureDate", "2022-08-22T06:54:35.486+00:00")
      .field("missionId", "61f3b1e65f915a05cb8885ec")
      .field("color", "#00FF00")
      .expect(201);

    expect(res.body).toMatchObject({
      status: true,
      message: "New Layer Created",
      data: expect.any(Object),
    });
  }, 15000);

  test("POST /upload-file-to-layer", async () => {
    const created_layers: any[] = [];
    {
      const res = await agent
        .post(full_url("create/Vector"))
        .attach("file", "/server/assets/poles.geojson")
        .field("name", randomUUID())
        .field("type", "Vector")
        .field("vector", "60c3a3c5ca0cbe039fce0d64")
        .field("captureDate", "2022-08-22T06:54:35.486+00:00")
        .field("missionId", "61f3b1e65f915a05cb8885ec")
        .field("color", "#00FF00")
        .field("icon", "MarkerIcon")
        .field("inHeritOriginalColorFromFile", "false")
        .expect(201);
      created_layers.push(res.body.data);
    }
    const res = await agent
      .post(full_url("upload-file-to-layer"))
      .attach("file", "/server/assets/image.png")
      .field("layerId", created_layers[0]._id)
      .expect(201);

    expect(res.body).toMatchObject({
      status: true,
      message: `File uploaded succefully to layer :${created_layers[0]._id}`,
      data: expect.any(Object),
    });
  });

  test("DELETE /delete-file-geojson", async () => {
    const created_layers: any[] = [];
    const created_layerFiles: any[] = [];
    {
      const res = await agent
        .post(full_url("create/Vector"))
        .attach("file", "/server/assets/poles.geojson")
        .field("name", randomUUID())
        .field("type", "Vector")
        .field("vector", "60c3a3c5ca0cbe039fce0d64")
        .field("captureDate", "2022-08-22T06:54:35.486+00:00")
        .field("missionId", "61f3b1e65f915a05cb8885ec")
        .field("color", "#00FF00")
        .field("icon", "MarkerIcon")
        .field("inHeritOriginalColorFromFile", "false")
        .expect(201);
      created_layers.push(res.body.data);

      const res2 = await agent
        .post(full_url("upload-file-to-layer"))
        .attach("file", "/server/assets/image.png")
        .field("layerId", created_layers[0]._id)
        .expect(201);
      created_layerFiles.push(res2.body.data);
    }

    const res = await agent
      .delete(full_url("delete-file-geojson"))
      .query({
        id: created_layerFiles[0]._id,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "File deleted",
      data: expect.any(Object),
    });
  }, 15000);

  test("PATCH /edit-layer", async () => {
    const created_layers: any[] = [];
    {
      const res = await agent
        .post(full_url("create/Vector"))
        .attach("file", "/server/assets/poles.geojson")
        .field("name", randomUUID())
        .field("type", "Vector")
        .field("vector", "60c3a3c5ca0cbe039fce0d64")
        .field("captureDate", "2022-08-22T06:54:35.486+00:00")
        .field("missionId", "61f3b1e65f915a05cb8885ec")
        .field("color", "#00FF00")
        .field("icon", "MarkerIcon")
        .field("inHeritOriginalColorFromFile", "false")
        .expect(201);
      created_layers.push(res.body.data);
    }
    const res = await agent
      .patch(full_url("edit-layer"))
      .query({ id: created_layers[0]._id })
      .send({
        name: "NewNameTestingUpdate" + randomUUID(),
        captureDate: "2022-07-20T06:54:35.486+00:00",
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Layer updated successfully",
      data: expect.any(Array),
    });
  });

  test("PATCH /changecolorbyId", async () => {
    const created_layers: any[] = [];
    {
      const res = await agent
        .post(full_url("create/Vector"))
        .attach("file", "/server/assets/poles.geojson")
        .field("name", randomUUID())
        .field("type", "Vector")
        .field("vector", "60c3a3c5ca0cbe039fce0d64")
        .field("captureDate", "2022-08-22T06:54:35.486+00:00")
        .field("missionId", "61f3b1e65f915a05cb8885ec")
        .field("color", "#00FF00")
        .field("icon", "MarkerIcon")
        .field("inHeritOriginalColorFromFile", "false")
        .expect(201);
      created_layers.push(res.body.data);
    }
    const res = await agent
      .patch(full_url("changecolorbyId"))
      .send({
        id: created_layers[0]._id,
        color: "#FF0000",
        icon: "MarkerIcon",
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      data: expect.any(Object),
    });
  });

  test("GET /getbymissionId", async () => {
    const created_layers: any[] = [];
    {
      const res = await agent
        .post(full_url("create/Vector"))
        .attach("file", "/server/assets/poles.geojson")
        .field("name", randomUUID())
        .field("type", "Vector")
        .field("vector", "60c3a3c5ca0cbe039fce0d64")
        .field("captureDate", "2022-08-22T06:54:35.486+00:00")
        .field("missionId", "61f3b1e65f915a05cb8885ec")
        .field("color", "#00FF00")
        .field("icon", "MarkerIcon")
        .field("inHeritOriginalColorFromFile", "false")
        .expect(201);
      created_layers.push(res.body.data);
    }
    const res = await agent
      .get(full_url("getbymissionId"))
      .query({
        missionId: created_layers[0].missionId,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Layer fetched successfully",
      data: expect.any(Object),
    });
  });

  test("GET /all-layers-for-mission", async () => {
    const created_layers: any[] = [];
    {
      const res = await agent
        .post(full_url("create/Vector"))
        .attach("file", "/server/assets/poles.geojson")
        .field("name", randomUUID())
        .field("type", "Vector")
        .field("vector", "60c3a3c5ca0cbe039fce0d64")
        .field("captureDate", "2022-08-22T06:54:35.486+00:00")
        .field("missionId", "61f3b1e65f915a05cb8885ec")
        .field("color", "#00FF00")
        .field("icon", "MarkerIcon")
        .field("inHeritOriginalColorFromFile", "false")
        .expect(201);
      created_layers.push(res.body.data);
    }
    const res = await agent
      .get(full_url("all-layers-for-mission"))
      .query({
        missionId: created_layers[0].missionId,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Zipping Started",
    });
  });

  test("GET /getrasterdetailsbyID", async () => {
    const created_layers_ids: any[] = [];
    {
      const res = await agent
        .post(full_url("create/Raster"))
        .attach("file", "/server/assets/Ortho_25cm.tif")
        .field("name", randomUUID())
        .field("type", "Raster")
        .field("raster", "60c3138f4764fb024a3c1a59")
        .field("captureDate", "2022-08-22T06:54:35.486+00:00")
        .field("missionId", "61f3b1e65f915a05cb8885ec")
        .field("color", "#00FF00")
        .expect(201);
      created_layers_ids.push(res.body.data._id);
    }
    const res = await agent
      .get(full_url("getrasterdetailsbyID"))
      .query({
        id: created_layers_ids[0],
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: `Fetched Raster Details for LayerID : ${created_layers_ids[0]}`,
      data: expect.any(Array),
    });
  }, 15000);

  test("GET /downloadassetbylayerId", async () => {
    const created_layers: any[] = [];
    {
      const res = await agent
        .post(full_url("create/Vector"))
        .attach("file", "/server/assets/poles.geojson")
        .field("name", randomUUID())
        .field("type", "Vector")
        .field("vector", "60c3a3c5ca0cbe039fce0d64")
        .field("captureDate", "2022-08-22T06:54:35.486+00:00")
        .field("missionId", "61f3b1e65f915a05cb8885ec")
        .field("color", "#00FF00")
        .field("icon", "MarkerIcon")
        .field("inHeritOriginalColorFromFile", "false")
        .expect(201);
      created_layers.push(res.body.data);
    }
    const res = await agent
      .get(full_url("downloadassetbylayerId"))
      .query({
        id: created_layers[0]._id,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: `Download Link generated for LayerID: ${created_layers[0]._id}`,
      link: expect.any(String),
    });
  });

  test("GET /download-asset-by-Id-to-kml", async () => {
    const created_layers: any[] = [];
    {
      const res = await agent
        .post(full_url("create/Vector"))
        .attach("file", "/server/assets/poles.geojson")
        .field("name", randomUUID())
        .field("type", "Vector")
        .field("vector", "60c3a3c5ca0cbe039fce0d64")
        .field("captureDate", "2022-08-22T06:54:35.486+00:00")
        .field("missionId", "61f3b1e65f915a05cb8885ec")
        .field("color", "#00FF00")
        .field("icon", "MarkerIcon")
        .field("inHeritOriginalColorFromFile", "false")
        .expect(201);
      created_layers.push(res.body.data);
    }
    const res = await agent
      .get(full_url("download-asset-by-Id-to-kml"))
      .query({
        id: created_layers[0]._id,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: `Download Link generated for LayerID: ${created_layers[0]._id}`,
      link: expect.any(String),
    });
  });

  test("GET /sort-all-layer", async () => {
    const created_layers: any[] = [];
    {
      const res = await agent
        .post(full_url("create/Vector"))
        .attach("file", "/server/assets/poles.geojson")
        .field("name", randomUUID())
        .field("type", "Vector")
        .field("vector", "60c3a3c5ca0cbe039fce0d64")
        .field("captureDate", "2022-08-22T06:54:35.486+00:00")
        .field("missionId", "61f3b1e65f915a05cb8885ec")
        .field("color", "#00FF00")
        .field("icon", "MarkerIcon")
        .field("inHeritOriginalColorFromFile", "false")
        .expect(201);
      created_layers.push(res.body.data);
    }
    const res = await agent
      .get(full_url("sort-all-layer"))
      .query({
        missionId: created_layers[0].missionId,
        name: "desc",
        createdAt: "desc",
        captureDate: "desc",
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.stringMatching(
        /Data sorted in (ascending|descending) order for (name|createdAt|captureDate)/,
      ),
      docs: expect.any(Array),
    });
  });

  test("GET /fetch-to-be-reviwed-files", async () => {
    const created_layers: any[] = [];
    {
      const res = await agent
        .post(full_url("create/Vector"))
        .attach("file", "/server/assets/poles.geojson")
        .field("name", randomUUID())
        .field("type", "Vector")
        .field("vector", "60c3a3c5ca0cbe039fce0d64")
        .field("captureDate", "2022-08-22T06:54:35.486+00:00")
        .field("missionId", "61f3b1e65f915a05cb8885ec")
        .field("color", "#00FF00")
        .field("icon", "MarkerIcon")
        .field("inHeritOriginalColorFromFile", "false")
        .expect(201);
      created_layers.push(res.body.data);

      await agent
        .post(full_url("upload-file-to-layer"))
        .attach("file", "/server/assets/image.png")
        .field("layerId", created_layers[0]._id)
        .expect(201);
    }
    const res = await agent
      .get(full_url("fetch-to-be-reviwed-files"))
      .query({
        layerId: created_layers[0]._id,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: `Sucessfully fetched to be reviwed images for layer: ${created_layers[0]._id}`,
      data: expect.any(Array),
    });
  });

  test("POST /filter-layer", async () => {
    await agent
      .post(full_url("create/Vector"))
      .attach("file", "/server/assets/poles.geojson")
      .field("name", randomUUID())
      .field("type", "Vector")
      .field("vector", "60c3a3c5ca0cbe039fce0d64")
      .field("captureDate", "2022-08-22T06:54:35.486+00:00")
      .field("missionId", "61f3b1e65f915a05cb8885ec")
      .field("color", "#00FF00")
      .field("icon", "MarkerIcon")
      .field("inHeritOriginalColorFromFile", "false")
      .expect(201);
    const res = await agent
      .post(full_url("filter-layer"))
      .send({
        time: "2 days",
        missionId: "61f3b1e65f915a05cb8885ec",
        createdAt: "desc",
        name: "desc",
        captureDate: "desc",
        type: ["Vector", "Raster"],
        vectorProps: true,
        rasterProps: true,
        vectorPropsType: true,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Sucessfully get Vector or Raster data ",
      data: expect.any(Array),
    });
  });

  test("PATCH /get-feature-by-layerId", async () => {
    const created_layers: any[] = [];
    {
      const res = await agent
        .post(full_url("create-vector-layer"))
        .send({
          name: randomUUID(),
          missionId: "61f3b1e65f915a05cb8885ec",
          vectorId: "60c3a13fca0cbe039fce0d4f",
          geoJSON: sampleGeojsonData,
        })
        .expect(201);
      created_layers.push(res.body.data);
    }
    const res = await agent
      .patch(full_url("get-feature-by-layerId"))
      .send({
        id: created_layers[0]._id,
        limit: "1",
        page: "0",
        key: "color",
        value: "#000000",
        range: ["#000000", "#FFFFFF"],
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      count: expect.any(Number),
      data: expect.any(Array),
    });
  });

  test("PATCH /get-feature-csv-by-layerIndex", async () => {
    const created_layers: any[] = [];
    {
      const res = await agent
        .post(full_url("create/Vector"))
        .attach("file", "/server/assets/poles.geojson")
        .field("name", randomUUID())
        .field("type", "Vector")
        .field("vector", "60c3a3c5ca0cbe039fce0d64")
        .field("captureDate", "2022-08-22T06:54:35.486+00:00")
        .field("missionId", "61f3b1e65f915a05cb8885ec")
        .field("color", "#00FF00")
        .field("icon", "MarkerIcon")
        .field("inHeritOriginalColorFromFile", "false")
        .expect(201);
      created_layers.push(res.body.data);
    }
    const res = await agent
      .patch(full_url("get-feature-csv-by-layerIndex"))
      .send({
        id: created_layers[0]._id,
        featureIndex: [0, 1, 2],
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "csv file created successfully!",
      pathh: expect.any(String),
    });
  });

  test("PATCH /assignLayerLabel", async () => {
    const created_layers: any[] = [];
    {
      const res = await agent
        .post(full_url("create/Vector"))
        .attach("file", "/server/assets/poles.geojson")
        .field("name", randomUUID())
        .field("type", "Vector")
        .field("vector", "60c3a3c5ca0cbe039fce0d64")
        .field("captureDate", "2022-08-22T06:54:35.486+00:00")
        .field("missionId", "61f3b1e65f915a05cb8885ec")
        .field("color", "#00FF00")
        .field("icon", "MarkerIcon")
        .field("inHeritOriginalColorFromFile", "false")
        .expect(201);
      created_layers.push(res.body.data);
    }
    const res = await agent
      .patch(full_url("assignLayerLabel"))
      .send({
        layerId: created_layers[0]._id,
        label: "Test Label",
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Layer Label updated",
      data: expect.any(Object),
    });
  });

  test("PATCH /auto-assign-uploaded-image", async () => {
    const created_layers: any[] = [];
    {
      const res = await agent
        .post(full_url("create/Vector"))
        .attach("file", "/server/assets/poles.geojson")
        .field("name", randomUUID())
        .field("type", "Vector")
        .field("vector", "60c3a3c5ca0cbe039fce0d64")
        .field("captureDate", "2022-08-22T06:54:35.486+00:00")
        .field("missionId", "61f3b1e65f915a05cb8885ec")
        .field("color", "#00FF00")
        .field("icon", "MarkerIcon")
        .field("inHeritOriginalColorFromFile", "false")
        .expect(201);
      created_layers.push(res.body.data);
    }
    const res = await agent
      .patch(full_url("auto-assign-uploaded-image"))
      .attach("file", "/server/assets/image.png")
      .attach("file", "/server/assets/image.png")
      .attach("file", "/server/assets/image.png")
      .field("Id", created_layers[0]._id)
      .field("radius", "100")
      .expect(201);

    expect(res.body).toMatchObject({
      status: true,
      message: "Auto assignment has been started",
    });
  });

  test("PATCH /images-review", async () => {
    const created_layers: any[] = [];
    const created_layerFiles: any[] = [];
    {
      const res = await agent
        .post(full_url("create/Vector"))
        .attach("file", "/server/assets/poles.geojson")
        .field("name", randomUUID())
        .field("type", "Vector")
        .field("vector", "60c3a3c5ca0cbe039fce0d64")
        .field("captureDate", "2022-08-22T06:54:35.486+00:00")
        .field("missionId", "61f3b1e65f915a05cb8885ec")
        .field("color", "#00FF00")
        .field("icon", "MarkerIcon")
        .field("inHeritOriginalColorFromFile", "false")
        .expect(201);
      created_layers.push(res.body.data);

      const res2 = await agent
        .post(full_url("upload-file-to-layer"))
        .attach("file", "/server/assets/image.png")
        .field("layerId", created_layers[0]._id)
        .expect(201);
      created_layerFiles.push(res2.body.data);
    }

    const res = await agent
      .patch(full_url("images-review"))
      .send({
        layerId: created_layers[0]._id,
        check: [created_layerFiles[0]],
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Image review successfully completed!",
    });
  });

  test("POST /pick-to-map-for-layer", async () => {
    const res = await agent
      .post(full_url("pick-to-map-for-layer"))
      .attach("file", "/server/assets/image.png")
      .field("name", randomUUID())
      .field("type", "Vector")
      .field("vectorId", "60c3a3c5ca0cbe039fce0d64")
      .field("missionId", "61f3b1e65f915a05cb8885ec")
      .field("color", "#00FF00")
      .field("icon", "MarkerIcon")
      .expect(201);

    expect(res.body).toMatchObject({
      status: true,
      message: "Sucessfully created the layer!",
    });
  });

  // test("PATCH /upload-file-geojson", async () => {
  //     const created_layers: any[] = [];
  //     {
  //         const res = await agent
  //         .post(full_url("create/Vector"))
  //         .attach("file", "/server/assets/poles.geojson")
  //         .field("name", randomUUID())
  //         .field("type", "Vector")
  //         .field("vector", "60c3a3c5ca0cbe039fce0d64")
  //         .field("captureDate", "2022-08-22T06:54:35.486+00:00")
  //         .field("missionId", "61f3b1e65f915a05cb8885ec")
  //         .field("color", "#00FF00")
  //         .field("icon", "MarkerIcon")
  //         .field("inHeritOriginalColorFromFile", "false")
  //         .expect(201);
  //         created_layers.push(res.body.data);
  //     }
  //     const res = await agent
  //         .patch(full_url("upload-file-geojson"))
  //         .attach("file", "/server/assets/image.png")
  //         .field("layerId", created_layers[0]._id)
  //         .field("sys_id", "abcdefg")
  //         .field("type", "image/png")
  //         .field("featureLabel", "Test Label")
  //         .field("centerPoints", JSON.stringify({
  //             "lat": 22,
  //             "long": 22
  //         }))
  //         .expect(200);

  //     expect(res.body).toMatchObject({
  //         status: true,
  //         message: expect.any(String),
  //         data: expect.any(Object)
  //     });
  // })

  test("PATCH /edit-geojson", async () => {
    const created_layers: any[] = [];
    {
      const res = await agent
        .post(full_url("create/Vector"))
        .attach("file", "/server/assets/poles.geojson")
        .field("name", randomUUID())
        .field("type", "Vector")
        .field("vector", "60c3a3c5ca0cbe039fce0d64")
        .field("captureDate", "2022-08-22T06:54:35.486+00:00")
        .field("missionId", "61f3b1e65f915a05cb8885ec")
        .field("color", "#00FF00")
        .field("icon", "MarkerIcon")
        .field("inHeritOriginalColorFromFile", "false")
        .expect(201);
      created_layers.push(res.body.data);
    }
    const res = await agent
      .patch(full_url("edit-geojson"))
      .send({
        id: created_layers[0]._id,
        featureIndex: "0",
        feature: sampleGeojsonData.features[0],
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Successfully edited GEOJSON And multiColor exist!",
      result: expect.any(Object),
    });
  });

  test("PATCH /addFeature", async () => {
    const created_layers: any[] = [];
    {
      const res = await agent
        .post(full_url("create/Vector"))
        .attach("file", "/server/assets/poles.geojson")
        .field("name", randomUUID())
        .field("type", "Vector")
        .field("vector", "60c3a3c5ca0cbe039fce0d64")
        .field("captureDate", "2022-08-22T06:54:35.486+00:00")
        .field("missionId", "61f3b1e65f915a05cb8885ec")
        .field("color", "#00FF00")
        .field("icon", "MarkerIcon")
        .field("inHeritOriginalColorFromFile", "false")
        .expect(201);
      created_layers.push(res.body.data);
    }
    const res = await agent
      .patch(full_url("addFeature"))
      .send({
        id: created_layers[0]._id,
        feature: sampleGeojsonData.features[0],
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Successfully added feature",
      data: expect.any(Object),
    });
  });

  test("PATCH /add-isReview-to-layerFiles", async () => {
    await agent
      .post(full_url("create/Vector"))
      .attach("file", "/server/assets/poles.geojson")
      .field("name", randomUUID())
      .field("type", "Vector")
      .field("vector", "60c3a3c5ca0cbe039fce0d64")
      .field("captureDate", "2022-08-22T06:54:35.486+00:00")
      .field("missionId", "61f3b1e65f915a05cb8885ec")
      .field("color", "#00FF00")
      .field("icon", "MarkerIcon")
      .field("inHeritOriginalColorFromFile", "false")
      .expect(201);
    const res = await agent
      .patch(full_url("add-isReview-to-layerFiles"))
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "layerFiles isReview property updated Successfully! ",
    });
  });

  test("PATCH /gen_2x_layerfiles", async () => {
    await agent
      .post(full_url("create/Vector"))
      .attach("file", "/server/assets/poles.geojson")
      .field("name", randomUUID())
      .field("type", "Vector")
      .field("vector", "60c3a3c5ca0cbe039fce0d64")
      .field("captureDate", "2022-08-22T06:54:35.486+00:00")
      .field("missionId", "61f3b1e65f915a05cb8885ec")
      .field("color", "#00FF00")
      .field("icon", "MarkerIcon")
      .field("inHeritOriginalColorFromFile", "false")
      .expect(201);
    const res = await agent
      .patch(full_url("gen_2x_layerfiles"))
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Successfully generated 2x files",
    });
  });

  test("DELETE /delete-geojson", async () => {
    const created_layers: any[] = [];
    {
      const res = await agent
        .post(full_url("create/Vector"))
        .attach("file", "/server/assets/poles.geojson")
        .field("name", randomUUID())
        .field("type", "Vector")
        .field("vector", "60c3a3c5ca0cbe039fce0d64")
        .field("captureDate", "2022-08-22T06:54:35.486+00:00")
        .field("missionId", "61f3b1e65f915a05cb8885ec")
        .field("color", "#00FF00")
        .field("icon", "MarkerIcon")
        .field("inHeritOriginalColorFromFile", "false")
        .expect(201);
      created_layers.push(res.body.data);
    }
    const res = await agent
      .delete(full_url("delete-geojson"))
      .send({
        id: created_layers[0]._id,
        featureIndex: "0",
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Feature Deleleted successfully",
    });
  }, 15000);

  test("DELETE /delete", async () => {
    const created_layers: any[] = [];
    {
      const res = await agent
        .post(full_url("create/Vector"))
        .attach("file", "/server/assets/poles.geojson")
        .field("name", randomUUID())
        .field("type", "Vector")
        .field("vector", "60c3a3c5ca0cbe039fce0d64")
        .field("captureDate", "2022-08-22T06:54:35.486+00:00")
        .field("missionId", "61f3b1e65f915a05cb8885ec")
        .field("color", "#00FF00")
        .field("icon", "MarkerIcon")
        .field("inHeritOriginalColorFromFile", "false")
        .expect(201);
      created_layers.push(res.body.data);
    }
    const res = await agent
      .delete(full_url("delete"))
      .query({
        id: created_layers[0]._id,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Layer successfully deleted",
      data: expect.any(Object),
    });
  }, 15000);

  test("DELETE /delete-multipleLayerFiles", async () => {
    const created_layers: any[] = [];
    const created_layerFiles: any[] = [];
    {
      const res = await agent
        .post(full_url("create/Vector"))
        .attach("file", "/server/assets/poles.geojson")
        .field("name", randomUUID())
        .field("type", "Vector")
        .field("vector", "60c3a3c5ca0cbe039fce0d64")
        .field("captureDate", "2022-08-22T06:54:35.486+00:00")
        .field("missionId", "61f3b1e65f915a05cb8885ec")
        .field("color", "#00FF00")
        .field("icon", "MarkerIcon")
        .field("inHeritOriginalColorFromFile", "false")
        .expect(201);
      created_layers.push(res.body.data);

      const res2 = await agent
        .post(full_url("upload-file-to-layer"))
        .attach("file", "/server/assets/image.png")
        .field("layerId", created_layers[0]._id)
        .expect(201);
      created_layerFiles.push(res2.body.data);
    }

    const res = await agent
      .delete(full_url("delete-multipleLayerFiles"))
      .send({
        layerFileIds: [created_layerFiles[0]._id],
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "LayerFiles successfully deleted",
      data: [created_layerFiles[0]._id],
    });
  });

  test("POST /delete-layers", async () => {
    const created_layers_ids: any[] = [];
    for (let i = 1; i <= 2; i++) {
      const res = await agent
        .post(full_url("create/Vector"))
        .attach("file", "/server/assets/poles.geojson")
        .field("name", randomUUID())
        .field("type", "Vector")
        .field("vector", "60c3a3c5ca0cbe039fce0d64")
        .field("captureDate", "2022-08-22T06:54:35.486+00:00")
        .field("missionId", "61f3b1e65f915a05cb8885ec")
        .field("color", "#00FF00")
        .field("icon", "MarkerIcon")
        .field("inHeritOriginalColorFromFile", "false")
        .expect(201);
      created_layers_ids.push(res.body.data._id);
    }
    const res = await agent
      .post(full_url("delete-layers"))
      .send({
        layers: created_layers_ids,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Layer successfully deleted",
      data: expect.any(Array),
    });
  }, 15000);
});
