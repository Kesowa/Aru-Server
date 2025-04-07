import { CurriedUrl, Login, LoginSuper, Logout } from "./utils/utils";
import { createLayer } from "./utils/layer";
import { SuperAgentTest } from "supertest";
import { createLayerGroup } from "./utils/layerGroup";

let agent: SuperAgentTest;
let superAdminAgent: SuperAgentTest;
beforeAll(async () => {
  agent = await Login();
  superAdminAgent = await LoginSuper();
});
afterAll(async () => {
  await Logout(agent);
  await Logout(superAdminAgent);
});
const full_url = CurriedUrl("layergroup");

describe("/layergroup API", () => {
  test("POST /create", async () => {
    await createLayerGroup(agent, superAdminAgent);
  });

  test("PATCH /edit", async () => {
    const layers = [await createLayer(agent, superAdminAgent), await createLayer(agent, superAdminAgent)];
    const layerGroup = await createLayerGroup(agent, superAdminAgent);

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
    const layerGroup = await createLayerGroup(agent, superAdminAgent);
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
    const layerGroup = await createLayerGroup(agent, superAdminAgent);
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
    const layerGroup = await createLayerGroup(agent, superAdminAgent);
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
