import { CurriedUrl, Login, Logout } from "./utils/utils";
import {SuperAgentTest} from "supertest";
import { randomUUID } from "crypto";

let agent: SuperAgentTest;

beforeAll(async () => (agent = await Login()));
afterAll(async () => await Logout(agent));
const full_url = CurriedUrl("layergroup");

describe("/layergroup API", () => {
  test("POST /create", async () => {
    const created_layers: any[] = [];
    {
      const res = await agent
        .post(CurriedUrl("layer")("create/Vector"))
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
      .post(full_url("create"))
      .send({
        name: randomUUID(),
        type: "Vector",
        layers: [created_layers[0]._id],
      })
      .expect(201);

    expect(res.body).toMatchObject({
      status: true,
      message: "Created a new layerGroup!",
      data: expect.any(Array),
    });
  });

  test("PATCH /edit", async () => {
    const created_layers_ids: any[] = [];
    const created_layergroups: any[] = [];
    for (let i = 0; i < 2; i++) {
      const res = await agent
        .post(CurriedUrl("layer")("create/Vector"))
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
    {
      const res = await agent
        .post(full_url("create"))
        .send({
          name: randomUUID(),
          type: "Vector",
          layers: [created_layers_ids[0]],
        })
        .expect(201);
      created_layergroups.push(res.body.data[0]);
    }

    const res = await agent
      .patch(full_url("edit"))
      .send({
        _id: created_layergroups[0]._id,
        layers: created_layers_ids,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "LayerGroup Updated Successfully!",
      data: expect.any(Object),
    });
  });

  test("GET /fetch", async () => {
    const created_layers_ids: any[] = [];
    const created_layergroups: any[] = [];
    {
      const res = await agent
        .post(CurriedUrl("layer")("create/Vector"))
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
    {
      const res = await agent
        .post(full_url("create"))
        .send({
          name: randomUUID(),
          type: "Vector",
          layers: [created_layers_ids[0]],
        })
        .expect(201);
      created_layergroups.push(res.body.data[0]);
    }

    const res = await agent
      .get(full_url("fetch"))
      .send({
        _id: created_layergroups[0]._id,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "LayerGroup fetched Successfully!",
      data: expect.any(Array),
    });
  });

  test("DELETE /delete", async () => {
    const created_layers_ids: any[] = [];
    const created_layergroups: any[] = [];
    {
      const res = await agent
        .post(CurriedUrl("layer")("create/Vector"))
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
    {
      const res = await agent
        .post(full_url("create"))
        .send({
          name: randomUUID(),
          type: "Vector",
          layers: [created_layers_ids[0]],
        })
        .expect(201);
      created_layergroups.push(res.body.data[0]);
    }

    const res = await agent
      .delete(full_url("delete"))
      .query({
        _id: created_layergroups[0]._id,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "LayerGroup deleted Successfully!",
      data: expect.any(Object),
    });
  });

  test("POST /delete-layerId", async () => {
    const created_layers_ids: any[] = [];
    const created_layergroups: any[] = [];
    {
      const res = await agent
        .post(CurriedUrl("layer")("create/Vector"))
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
    {
      const res = await agent
        .post(full_url("create"))
        .send({
          name: randomUUID(),
          type: "Vector",
          layers: [created_layers_ids[0]],
        })
        .expect(201);
      created_layergroups.push(res.body.data[0]);
    }

    const res = await agent
      .post(full_url("delete-layerId"))
      .send({
        _id: created_layergroups[0]._id,
        layers: [created_layers_ids[0]],
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "LayersId deleted Successfully!",
    });
  });
});
