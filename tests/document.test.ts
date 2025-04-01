import { createDocument } from "./utils/document";
import { CurriedUrl, Login, Logout } from "./utils/utils";
import { SuperAgentTest } from "supertest";

let agent: SuperAgentTest;

beforeAll(async () => (agent = await Login()));
afterAll(async () => await Logout(agent));
const full_url = CurriedUrl("document");

describe("/document API", () => {
  test("POST /create", async () => {
    await createDocument(agent);
  });

  test("GET /getbymissionId", async () => {
    const doc = await createDocument(agent);
    const res = await agent
      .get(full_url("getbymissionId"))
      .query({
        missionId: doc.missionId,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Documents fetched successfully",
      data: expect.any(Object),
    });
  });

  test("GET /zipbyId", async () => {
    const doc = await createDocument(agent);
    const res = await agent
      .get(full_url("zipbyId"))
      .query({
        missionId: doc.missionId,
        folderName: doc.folderName,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Zipping Started",
    });
  });

  // WORKS
  test("DELETE /delete-multiple", async () => {
    const doc = await createDocument(agent);
    const res = await agent
      .delete(full_url("delete-multiple"))
      .send({
        id: [doc._id],
      })
      .expect(200);
    expect(res.body).toMatchObject({
      status: true,
      message: "Documents deleted",
    });
  });
});
