import { CurriedUrl, Login, Logout } from "./utils/utils";
import { createLayer, createRasterLayer, createVectorLayer } from "./utils/layer";
import { SuperAgentTest } from "supertest";
import { uploadFile } from "./utils/upload";
import { faker } from "@faker-js/faker";

let agent: SuperAgentTest;

beforeAll(async () => {
  agent = await Login();
});
afterAll(async () => await Logout(agent));
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
        id: layerFile.body.data._id,
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
      data: expect.any(Object),
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
      data: expect.any(Object),
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
      message: expect.any(String),
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
        missionId: layer.missionId,
        createdAt: "desc",
        name: "desc",
        captureDate: "desc",
        type: ["Vector", "Raster"],
        vectorProps: ["Area Boundary", "Electric Pole"],
        rasterProps: ["ORTHO"],
        vectorPropsType: ["MultiPolygon", "Polygon", "Point"],
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
    const layer = await createLayer(agent);
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
      .query({
        mode: "GeoCoord"
      })
      .send({
        file: fileIds,
        Id: layer._id,
        radius: "100",
      })
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
        check: [layerFile.body.data._id],
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
        "file": [fileId],
        "name": faker.address.street(),
        "type": "Vector",
        "vectorType": "Electric Pole",
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

  test("PATCH /upload-file-geojson", async () => {
    const layer = await createVectorLayer(agent);
    const fileId = await uploadFile(agent, "./assets/image.png");
    const res = await agent
      .patch(full_url("upload-file-geojson"))
      .send({
        "file": fileId,
        "layerId": layer._id,
        "sys_Id": "abcdefg",
        "type": "image/png",
        "featureLabel": "Test Label",
        "centerPoints": {
          "lat": 22,
          "lng": 22
        },
      })
      .expect(201);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: expect.any(Object)
    });
  })

  test("PATCH /edit-geojson", async () => {
    const layer = await createLayer(agent);
    const res = await agent
      .patch(full_url("edit-geojson"))
      .send({
        id: layer._id,
        featureIndex: "0",
        feature: sampleGeojsonData.features[0],
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: expect.any(Object),
    });
  });

  test("PATCH /addFeature", async () => {
    const layer = await createLayer(agent);
    const res = await agent
      .patch(full_url("addFeature"))
      .send({
        id: layer._id,
        feature: sampleGeojsonData.features[0],
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: expect.any(Object),
    });
  });

  test("DELETE /delete-geojson", async () => {
    const layer = await createVectorLayer(agent);
    const res = await agent
      .delete(full_url("delete-geojson"))
      .send({
        id: layer._id,
        featureIndex: "0",
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
    });
  });

  test("DELETE /delete", async () => {
    const layer = await createVectorLayer(agent);
    const res = await agent
      .delete(full_url("delete"))
      .query({
        id: layer._id,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: expect.any(Object),
    });
  });

  test("DELETE /delete-multipleLayerFiles", async () => {
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
      .delete(full_url("delete-multipleLayerFiles"))
      .send({
        layerFileIds: [layerFile.body.data._id],
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: expect.any(Array),
    });
  });

  test("POST /delete-layers", async () => {
    const createdLayers = [
      await createVectorLayer(agent),
      await createRasterLayer(agent),
    ];
    const res = await agent
      .post(full_url("delete-layers"))
      .send({
        layers: createdLayers.map(layer => layer._id),
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: expect.any(Array),
    });
  }, 15000);
});
