import { CurriedUrl, Login, Logout } from "./utils/utils";
import {SuperAgentTest} from "supertest";

let agent: SuperAgentTest;

beforeAll(async () => (agent = await Login()));
afterAll(async () => Logout(agent));
const full_url = CurriedUrl("document");

describe("/document API", () => {
  test("POST /create", async () => {
    const res = await agent
      .post(full_url("create"))
      .field("missionId", "61f3b1e65f915a05cb8885ec")
      .field("folderName", "rawPhotos")
      .field("type", "image/png")
      .attach("file", "/server/assets/image.png")
      .expect(201);

    expect(res.body).toMatchObject({
      status: true,
      message: "New Document(s) Uploaded",
      data: expect.any(Object),
    });
  });

  test("GET /getbymissionId", async () => {
    const created_docs: any[] = [];
    {
      const res = await agent
        .post(full_url("create"))
        .field("missionId", "61f3b1e65f915a05cb8885ec")
        .field("folderName", "rawPhotos")
        .field("type", "image/png")
        .attach("file", "/server/assets/image.png")
        .expect(201);
      created_docs.push(res.body.data);
    }
    const res = await agent
      .get(full_url("getbymissionId"))
      .query({
        missionId: created_docs[0].missionId,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Documents fetched successfully",
      data: expect.any(Object),
    });
  });

  test("GET /zipbyId", async () => {
    const created_docs: any[] = [];
    {
      const res = await agent
        .post(full_url("create"))
        .field("missionId", "61f3b1e65f915a05cb8885ec")
        .field("folderName", "rawPhotos")
        .field("type", "image/png")
        .attach("file", "/server/assets/image.png")
        .expect(201);
      created_docs.push(res.body.data);
    }
    const res = await agent
      .get(full_url("zipbyId"))
      .query({
        missionId: created_docs[0].missionId,
        folderName: created_docs[0].folderName,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Zipping Started",
    });
  });

  test("PATCH /update-size-for-exist-doc", async () => {
    await agent
      .post(full_url("create"))
      .field("missionId", "61f3b1e65f915a05cb8885ec")
      .field("folderName", "rawPhotos")
      .field("type", "image/png")
      .attach("file", "/server/assets/image.png")
      .expect(201);
    const res = await agent
      .patch(full_url("update-size-for-exist-doc"))
      .expect(200);
    expect(res.body).toMatchObject({
      status: true,
      message: "Successfully updated fileSize",
    });
  });

  // WORKS
  test("DELETE /delete-multiple", async () => {
    let created_doc: any;
    {
      const res = await agent
        .post(full_url("create"))
        .field("missionId", "61f3b1e65f915a05cb8885ec")
        .field("folderName", "rawPhotos")
        .field("type", "image/png")
        .attach("file", "/server/assets/image.png")
        .expect(201);
      created_doc = res.body.data;
    }
    const res = await agent
      .delete(full_url("delete-multiple"))
      .send({
        id: [created_doc._id],
      })
      .expect(200);
    expect(res.body).toMatchObject({
      status: true,
      message: "Documents deleted",
    });
  });
});
