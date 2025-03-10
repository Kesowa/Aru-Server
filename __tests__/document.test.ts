import { CurriedUrl, Login } from "../config/utils";
import request from "supertest";
import app from "../src/app";

let token: string;
beforeAll(async () => (token = await Login()));
const full_url = CurriedUrl("document");

describe("/document API", () => {
  test("POST /create", async () => {
    const res = await request(app)
      .post(full_url("create"))
      .set("Authorization", `Bearer ${token}`)
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
      const res = await request(app)
        .post(full_url("create"))
        .set("Authorization", `Bearer ${token}`)
        .field("missionId", "61f3b1e65f915a05cb8885ec")
        .field("folderName", "rawPhotos")
        .field("type", "image/png")
        .attach("file", "/server/assets/image.png")
        .expect(201);
      created_docs.push(res.body.data);
    }
    const res = await request(app)
      .get(full_url("getbymissionId"))
      .set("Authorization", `Bearer ${token}`)
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
      const res = await request(app)
        .post(full_url("create"))
        .set("Authorization", `Bearer ${token}`)
        .field("missionId", "61f3b1e65f915a05cb8885ec")
        .field("folderName", "rawPhotos")
        .field("type", "image/png")
        .attach("file", "/server/assets/image.png")
        .expect(201);
      created_docs.push(res.body.data);
    }
    const res = await request(app)
      .get(full_url("zipbyId"))
      .set("Authorization", `Bearer ${token}`)
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
    await request(app)
      .post(full_url("create"))
      .set("Authorization", `Bearer ${token}`)
      .field("missionId", "61f3b1e65f915a05cb8885ec")
      .field("folderName", "rawPhotos")
      .field("type", "image/png")
      .attach("file", "/server/assets/image.png")
      .expect(201);
    const res = await request(app)
      .patch(full_url("update-size-for-exist-doc"))
      .set("Authorization", `Bearer ${token}`)
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
      const res = await request(app)
        .post(full_url("create"))
        .set("Authorization", `Bearer ${token}`)
        .field("missionId", "61f3b1e65f915a05cb8885ec")
        .field("folderName", "rawPhotos")
        .field("type", "image/png")
        .attach("file", "/server/assets/image.png")
        .expect(201);
      created_doc = res.body.data;
    }
    const res = await request(app)
      .delete(full_url("delete-multiple"))
      .set("Authorization", `Bearer ${token}`)
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
