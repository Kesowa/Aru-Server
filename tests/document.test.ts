import { createDocument } from "./utils/document";
import { CurriedUrl, Login, LoginSuper, Logout } from "./utils/utils";
import { SuperAgentTest } from "supertest";

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
const full_url = CurriedUrl("document");

describe("/document API", () => {
  test("POST /create", async () => {
    await createDocument(agent, superAdminAgent);
  });

  test("GET /getbymissionId", async () => {
    const doc = await createDocument(agent, superAdminAgent);
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
    const doc = await createDocument(agent, superAdminAgent);
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
    const doc = await createDocument(agent, superAdminAgent);
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
