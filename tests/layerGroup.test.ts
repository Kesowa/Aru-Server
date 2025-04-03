import { CurriedUrl, Login, Logout } from "./utils/utils";
import { createLayer } from "./utils/layer";
import { SuperAgentTest } from "supertest";
import { createLayerGroup } from "./utils/layerGroup";

let agent: SuperAgentTest;

beforeAll(async () => (agent = await Login()));
afterAll(async () => await Logout(agent));
const full_url = CurriedUrl("layergroup");

describe("/layergroup API", () => {
  test("POST /create", async () => {
    await createLayerGroup(agent);
  });

  test("PATCH /edit", async () => {
    const layers = [await createLayer(agent), await createLayer(agent)];
    const layerGroup = await createLayerGroup(agent);

    const res = await agent
      .patch(full_url("edit"))
      .send({
        _id: layerGroup._id,
        layers: layers.map(layer => layer._id),
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: expect.any(Object),
    });
  });

  test("GET /fetch", async () => {
    const layerGroup = await createLayerGroup(agent);
    const res = await agent
      .get(full_url("fetch"))
      .send({
        _id: layerGroup._id,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: expect.any(Array),
    });
  });

  test("DELETE /delete", async () => {
    const layerGroup = await createLayerGroup(agent);
    const res = await agent
      .delete(full_url("delete"))
      .query({
        _id: layerGroup._id,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: expect.any(Object),
    });
  });

  test("POST /delete-layerId", async () => {
    const layerGroup = await createLayerGroup(agent);
    const res = await agent
      .post(full_url("delete-layerId"))
      .send({
        _id: layerGroup._id,
        layers: [layerGroup.layers[0]],
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
    });
  });
});
