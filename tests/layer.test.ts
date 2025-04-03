import { CurriedUrl, Login, Logout } from "./utils/utils";
import { createLayer, createRasterLayer, createVectorLayer } from "./utils/layer";
import { SuperAgentTest } from "supertest";
import { randomUUID } from "crypto";
import { uploadFile } from "./utils/upload";
import { faker } from "@faker-js/faker";

let agent: SuperAgentTest;

beforeAll(async () => {
  agent = await Login();
  afterAll(async () => await Logout(agent));
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
    await createLayer(agent);
  });

  test("POST /create-vector-layer", async () => {
    await createVectorLayer(agent);
  });

  test("POST /create/Raster", async () => {
    await createRasterLayer(agent);
  }, 15000);

  test("POST /upload-file-to-layer", async () => {
    const layer = await createVectorLayer(agent);
    const fileId = await uploadFile(agent, "./assets/image.png");
    const res = await agent
      .post(full_url("upload-file-to-layer"))
      .send({
        "file": fileId,
        "layerId": layer._id,
      })
      .expect(201);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: expect.any(Object),
    });
  });

  test("DELETE /delete-file-geojson", async () => {
    const layer = await createVectorLayer(agent);
    const fileId = await uploadFile(agent, "./assets/image.png");
    const layerFile = await agent
      .post(full_url("upload-file-to-layer"))
      .send({
        "file": fileId,
        "layerId": layer._id,
      })
      .expect(201);

    const res = await agent
      .delete(full_url("delete-file-geojson"))
      .query({
        id: layerFile.body._id,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: expect.any(Object),
    });
  }, 15000);

  test("PATCH /edit-layer", async () => {
    const layer = await createVectorLayer(agent);
    const res = await agent
      .patch(full_url("edit-layer"))
      .query({ id: layer._id })
      .send({
        name: faker.address.street(),
        captureDate: new Date(),
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: expect.any(Array),
    });
  });

  test("PATCH /changecolorbyId", async () => {
    const layer = await createVectorLayer(agent);
    const res = await agent
      .patch(full_url("changecolorbyId"))
      .send({
        id: layer._id,
        color: "#FF0000",
        // icon: "MarkerIcon",
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      data: expect.any(Object),
    });
  });

  test("GET /getbymissionId", async () => {
    const layer = await createVectorLayer(agent);
    const res = await agent
      .get(full_url("getbymissionId"))
      .query({
        missionId: layer.missionId,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: expect.any(Array),
    });
  });

  test("GET /all-layers-for-mission", async () => {
    const layer = await createVectorLayer(agent);
    const res = await agent
      .get(full_url("all-layers-for-mission"))
      .query({
        missionId: layer.missionId,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: layer._id,
    });
  });

  test("GET /getrasterdetailsbyID", async () => {
    const layer = await createRasterLayer(agent);
    const res = await agent
      .get(full_url("getrasterdetailsbyID"))
      .query({
        id: layer._id,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: expect.any(Array),
    });
  }, 15000);

  test("GET /downloadassetbylayerId", async () => {
    const layer = await createVectorLayer(agent);
    const res = await agent
      .get(full_url("downloadassetbylayerId"))
      .query({
        id: layer._id,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      link: expect.any(String),
    });
  });

  test("GET /download-asset-by-Id-to-kml", async () => {
    const layer = await createVectorLayer(agent);
    const res = await agent
      .get(full_url("download-asset-by-Id-to-kml"))
      .query({
        id: layer._id,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      link: expect.any(String),
    });
  });

  test("GET /sort-all-layer", async () => {
    const layer = await createVectorLayer(agent);
    const res = await agent
      .get(full_url("sort-all-layer"))
      .query({
        missionId: layer.missionId,
        name: "desc",
        createdAt: "desc",
        captureDate: "desc",
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      docs: expect.any(Array),
    });
  });

  test("GET /fetch-to-be-reviwed-files", async () => {
    const layer = await createVectorLayer(agent);
    const fileId = await uploadFile(agent, "./assets/image.png");
    await agent
      .post(full_url("upload-file-to-layer"))
      .send({
        "file": fileId,
        "layerId": layer._id,
      })
      .expect(201);
    const res = await agent
      .get(full_url("fetch-to-be-reviwed-files"))
      .query({
        layerId: layer._id,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: expect.any(Array),
    });
  });

  test("POST /filter-layer", async () => {
    const layer = await createVectorLayer(agent);
    const res = await agent
      .post(full_url("filter-layer"))
      .send({
        time: "2 days",
        missionId: layer._id,
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
      message: expect.any(String),
      data: expect.any(Array),
    });
  });

  test("PATCH /get-feature-by-layerId", async () => {
    const layer = await createVectorLayer(agent);
    const res = await agent
      .patch(full_url("get-feature-by-layerId"))
      .send({
        id: layer._id,
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
    const layer = await createVectorLayer(agent);
    const res = await agent
      .patch(full_url("get-feature-csv-by-layerIndex"))
      .send({
        id: layer._id,
        featureIndex: [0, 1, 2],
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      pathh: expect.any(String),
    });
  });

  test("PATCH /assignLayerLabel", async () => {
    const layer = await createVectorLayer(agent);
    const res = await agent
      .patch(full_url("assignLayerLabel"))
      .send({
        layerId: layer._id,
        label: "Test Label",
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: expect.any(Object),
    });
  });

  test("PATCH /auto-assign-uploaded-image", async () => {
    const layer = await createVectorLayer(agent);
    const fileIds = [
      await uploadFile(agent, "./assets/image.png"),
      await uploadFile(agent, "./assets/image.png"),
      await uploadFile(agent, "./assets/image.png"),
    ]
    const res = await agent
      .patch(full_url("auto-assign-uploaded-image"))
      .send({
        file: fileIds,
        Id: layer._id,
        radius: "100"
      })
      .field("radius", "100")
      .expect(201);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
    });
  });

  test("PATCH /images-review", async () => {
    const layer = await createVectorLayer(agent);
    const fileId = await uploadFile(agent, "./assets/image.png");
    const layerFile = await agent
      .post(full_url("upload-file-to-layer"))
      .send({
        "file": fileId,
        "layerId": layer._id,
      })
      .expect(201);

    const res = await agent
      .patch(full_url("images-review"))
      .send({
        layerId: layer._id,
        check: [layerFile.body._id],
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
    });
  });

  test("POST /pick-to-map-for-layer", async () => {
    const fileId = await uploadFile(agent, "./assets/image.png");
    const res = await agent
      .post(full_url("pick-to-map-for-layer"))
      .send({
        "file": fileId,
        "name": faker.address.street(),
        "type": "Vector",
        "vector": "Electric Pole",
        "missionId": "61f3b1e65f915a05cb8885ec", // !TODO replace
        "color": "#00FF00",
        "icon": "MarkerIcon",
      })
      .expect(201);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
    });
  });

  // test("PATCH /upload-file-geojson", async () => {
  //     const created_layers: any[] = [];
  //     {
  //         const res = await agent
  //         .post(full_url("create/Vector"))
  //         .attach("file", "./assets/poles.geojson")
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
  //         .attach("file", "./assets/image.png")
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
        .attach("file", "./assets/poles.geojson")
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
        .attach("file", "./assets/poles.geojson")
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
      .attach("file", "./assets/poles.geojson")
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
      .attach("file", "./assets/poles.geojson")
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
        .attach("file", "./assets/poles.geojson")
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
        .attach("file", "./assets/poles.geojson")
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
        .attach("file", "./assets/poles.geojson")
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
        .attach("file", "./assets/image.png")
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
        .attach("file", "./assets/poles.geojson")
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
