import { CurriedUrl, LoginSuper } from "../config/utils";
import request from "supertest";
import app from "../src/app";
import { randomUUID } from "crypto";

let token: string;
beforeAll(async () => (token = await LoginSuper()));
const full_url = CurriedUrl("admin/package");

describe("/package API", () => {
  test("POST /upload-poster", async () => {
    const res = await request(app)
      .post(full_url("upload-poster"))
      .set("Authorization", `Bearer ${token}`)
      .attach("poster", "/server/assets/image.png")
      .expect(201);

    expect(res.body).toMatchObject({
      status: true,
      message: "file uploaded sucessfully",
      file: expect.any(String),
    });
  });

  test("POST /create", async () => {
    let filePath: string = "";
    {
      const res = await request(app)
        .post(full_url("upload-poster"))
        .set("Authorization", `Bearer ${token}`)
        .attach("poster", "/server/assets/image.png")
        .expect(201);
      filePath = res.body.file;
    }
    const res = await request(app)
      .post(full_url("create"))
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: randomUUID(),
        bandwidth: Math.floor(Math.random() * 1000),
        storage: Math.floor(Math.random() * 1000),
        duration: Math.floor(Math.random() * 1000),
        userCount: Math.floor(Math.random() * 1000),
        missionCount: Math.floor(Math.random() * 100),
        layerCount: Math.floor(Math.random() * 10000),
        alertCount: Math.floor(Math.random() * 10000),
        vodCount: Math.floor(Math.random() * 100),
        clientCount: Math.floor(Math.random() * 100),
        locationCount: Math.floor(Math.random() * 100),
        userGroupCount: Math.floor(Math.random() * 100),
        poster: filePath,
      })
      .expect(201);

    expect(res.body).toMatchObject({
      status: true,
      message: "Package created sucessfully.",
      data: expect.any(Object),
    });
  });

  test("GET /fetchall", async () => {
    {
      let filePath: string = "";
      const res1 = await request(app)
        .post(full_url("upload-poster"))
        .set("Authorization", `Bearer ${token}`)
        .attach("poster", "/server/assets/image.png")
        .expect(201);
      filePath = res1.body.file;

      const res = await request(app)
        .post(full_url("create"))
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: randomUUID(),
          bandwidth: Math.floor(Math.random() * 1000),
          storage: Math.floor(Math.random() * 1000),
          duration: Math.floor(Math.random() * 1000),
          userCount: Math.floor(Math.random() * 1000),
          missionCount: Math.floor(Math.random() * 100),
          layerCount: Math.floor(Math.random() * 10000),
          alertCount: Math.floor(Math.random() * 10000),
          vodCount: Math.floor(Math.random() * 100),
          clientCount: Math.floor(Math.random() * 100),
          locationCount: Math.floor(Math.random() * 100),
          userGroupCount: Math.floor(Math.random() * 100),
          poster: filePath,
        })
        .expect(201);
    }
    const res = await request(app)
      .get(full_url("fetchall"))
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Package fetched sucessfully.",
      data: expect.any(Array),
    });
  });

  test("GET /fetchactive", async () => {
    {
      let filePath: string = "";
      const res1 = await request(app)
        .post(full_url("upload-poster"))
        .set("Authorization", `Bearer ${token}`)
        .attach("poster", "/server/assets/image.png")
        .expect(201);
      filePath = res1.body.file;

      const res = await request(app)
        .post(full_url("create"))
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: randomUUID(),
          bandwidth: Math.floor(Math.random() * 1000),
          storage: Math.floor(Math.random() * 1000),
          duration: Math.floor(Math.random() * 1000),
          userCount: Math.floor(Math.random() * 1000),
          missionCount: Math.floor(Math.random() * 100),
          layerCount: Math.floor(Math.random() * 10000),
          alertCount: Math.floor(Math.random() * 10000),
          vodCount: Math.floor(Math.random() * 100),
          clientCount: Math.floor(Math.random() * 100),
          locationCount: Math.floor(Math.random() * 100),
          userGroupCount: Math.floor(Math.random() * 100),
          poster: filePath,
        })
        .expect(201);
    }
    const res = await request(app)
      .get(full_url("fetchactive"))
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Package fetched sucessfully.",
      data: expect.any(Array),
    });
  });

  test("PATCH /edit-package-for-Id", async () => {
    const created_packages: string[] = [];
    {
      let filePath: string = "";
      const res1 = await request(app)
        .post(full_url("upload-poster"))
        .set("Authorization", `Bearer ${token}`)
        .attach("poster", "/server/assets/image.png")
        .expect(201);
      filePath = res1.body.file;

      const res = await request(app)
        .post(full_url("create"))
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: randomUUID(),
          bandwidth: Math.floor(Math.random() * 1000),
          storage: Math.floor(Math.random() * 1000),
          duration: Math.floor(Math.random() * 1000),
          userCount: Math.floor(Math.random() * 1000),
          missionCount: Math.floor(Math.random() * 100),
          layerCount: Math.floor(Math.random() * 10000),
          alertCount: Math.floor(Math.random() * 10000),
          vodCount: Math.floor(Math.random() * 100),
          clientCount: Math.floor(Math.random() * 100),
          locationCount: Math.floor(Math.random() * 100),
          userGroupCount: Math.floor(Math.random() * 100),
          poster: filePath,
        })
        .expect(201);
      created_packages.push(res.body.data._id);
    }
    const res = await request(app)
      .patch(full_url("edit-package-for-Id"))
      .set("Authorization", `Bearer ${token}`)
      .send({
        _id: created_packages[0],
        name: randomUUID(),
        bandwidth: Math.floor(Math.random() * 1000),
        storage: Math.floor(Math.random() * 1000),
        duration: Math.floor(Math.random() * 1000),
        userCount: Math.floor(Math.random() * 1000),
        missionCount: Math.floor(Math.random() * 100),
        layerCount: Math.floor(Math.random() * 10000),
        alertCount: Math.floor(Math.random() * 10000),
        vodCount: Math.floor(Math.random() * 100),
        clientCount: Math.floor(Math.random() * 100),
        locationCount: Math.floor(Math.random() * 100),
        userGroupCount: Math.floor(Math.random() * 100),
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Package updated sucessfully.",
      data: expect.any(Object),
    });
  });

  test("DELETE /delete-package-for-Id", async () => {
    const created_packages: string[] = [];
    {
      let filePath: string = "";
      const res1 = await request(app)
        .post(full_url("upload-poster"))
        .set("Authorization", `Bearer ${token}`)
        .attach("poster", "/server/assets/image.png")
        .expect(201);
      filePath = res1.body.file;

      const res = await request(app)
        .post(full_url("create"))
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: randomUUID(),
          bandwidth: Math.floor(Math.random() * 1000),
          storage: Math.floor(Math.random() * 1000),
          duration: Math.floor(Math.random() * 1000),
          userCount: Math.floor(Math.random() * 1000),
          missionCount: Math.floor(Math.random() * 100),
          layerCount: Math.floor(Math.random() * 10000),
          alertCount: Math.floor(Math.random() * 10000),
          vodCount: Math.floor(Math.random() * 100),
          clientCount: Math.floor(Math.random() * 100),
          locationCount: Math.floor(Math.random() * 100),
          userGroupCount: Math.floor(Math.random() * 100),
          poster: filePath,
        })
        .expect(201);
      created_packages.push(res.body.data._id);
    }
    const res = await request(app)
      .delete(full_url("delete-package-for-Id"))
      .set("Authorization", `Bearer ${token}`)
      .send({
        _id: created_packages[0],
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Package deleted sucessfully.",
      data: expect.any(Object),
    });
  });
});
