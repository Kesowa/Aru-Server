import { CurriedUrl, Login } from "../config/utils";
import request from "supertest";
import app from "../src/app";
import { randomUUID } from "crypto";
import fs from "fs/promises";

let token: string;
beforeAll(async () => (token = await Login()));
const full_url = CurriedUrl("VOD");

describe("/vod API", () => {
  let vod_id: string;
  test("POST /save-VOD", async () => {
    const metadata = [
      "61f3b1e65f915a05cb8885ec",
      "6267dd4b2a2d394080a20849",
      "6123317cdaacac04cdb2d805",
      "5f204f03b9445726102781a8",
    ];
    const videoMetadata = Buffer.from(metadata.join("-")).toString("base64");
    const filename = videoMetadata + "-video.mp4";
    await fs.copyFile(
      "/server/assets/video.mp4",
      "/server/src/public/vod/" + filename
    );
    const res = await request(app)
      .post(full_url("save-VOD"))
      .set("Authorization", `Bearer ${token}`)
      .send({
        filename: filename,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: expect.any(Object),
    });
    vod_id = res.body.data._id;
  });

  // Too noisy, will need improvement to video processing pipeline
  test.skip("POST /save-vod-manual", async () => {
    const res = await request(app)
      .post(full_url("save-vod-manual"))
      .set("Authorization", `Bearer ${token}`)
      .field("locationID", "6123317cdaacac04cdb2d805") // exists in db
      .field("missionID", "61f3b1e65f915a05cb8885ec") // exists in db
      .field("flightID", "6267dd4b2a2d394080a20849") // exists in db
      .attach("video", "/server/assets/video.mp4") // doesn't yet exist
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Sucessfully uploaded the video",
      file: expect.any(String),
    });
  });

  // Not for use in production
  test.skip("PATCH /test-vod-inject", async () => {
    await request(app)
      .post(full_url("save-vod-manual"))
      .set("Authorization", `Bearer ${token}`)
      .field("locationID", "6123317cdaacac04cdb2d805") // exists in db
      .field("missionID", "61f3b1e65f915a05cb8885ec") // exists in db
      .field("flightID", "6267dd4b2a2d394080a20849") // exists in db
      .attach("video", "/server/assets/video.mp4") // doesn't yet exist
      .expect(200);
    const res = await request(app)
      .patch(full_url("test-vod-inject"))
      .set("Authorization", `Bearer ${token}`)
      .send({
        limit: 10,
        locationId: "6123317cdaacac04cdb2d805",
        flightId: "6267dd4b2a2d394080a20849",
        missionId: "61f3b1e65f915a05cb8885ec",
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Injected successfully",
      data: expect.any(Array),
    });
  });

  // Will pass as long as save-vod does
  test("GET /get-by-missionID", async () => {
    const res = await request(app)
      .get(full_url("get-by-missionID"))
      .set("Authorization", `Bearer ${token}`)
      .query({
        missionID: "61f3b1e65f915a05cb8885ec",
        page: 0,
        sort: "createdAt:desc",
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "sucessfully fetched the VODs",
      TotalPages: expect.any(Number),
      data: expect.any(Array),
    });
  });

  test("GET /get-count-by-missionID", async () => {
    const res = await request(app)
      .get(full_url("get-count-by-missionID"))
      .set("Authorization", `Bearer ${token}`)
      .query({
        missionID: "61f3b1e65f915a05cb8885ec",
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "sucessfully fetched the VODs",
      data: {
        count: expect.any(Number),
      },
    });
  });

  test("GET /get-by-flightID", async () => {
    const res = await request(app)
      .get(full_url("get-by-flightID"))
      .set("Authorization", `Bearer ${token}`)
      .query({
        flightID: "6267dd4b2a2d394080a20849",
        page: 0,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "sucessfully fetched the VODs",
      TotalPages: expect.any(Number),
      data: expect.any(Array),
    });
  });

  test("GET /get-by-location-ID", async () => {
    const res = await request(app)
      .get(full_url("get-by-location-ID"))
      .set("Authorization", `Bearer ${token}`)
      .query({
        id: "6123317cdaacac04cdb2d805",
        page: 1,
        limit: 10,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "sucessfully fetched the VODs",
      data: expect.any(Array),
      total: expect.any(Number),
    });
  });

  test("PATCH /edit-by-ID", async () => {
    const res = await request(app)
      .patch(full_url("edit-by-ID"))
      .set("Authorization", `Bearer ${token}`)
      .send({
        id: vod_id,
        update: {
          videoName: randomUUID(),
        },
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "VOD renamed sucessfully.",
      data: expect.any(Object),
    });
  });

  test("PATCH /insert-tenantID", async () => {
    const res = await request(app)
      .patch(full_url("insert-tenantID"))
      .set("Authorization", `Bearer ${token}`)
      .send({
        tenantID: "5f204f03b9445726102781a8", // exists in db
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: expect.any(Array),
    });
  });

  test("DELETE /delete-by-ID", async () => {
    const res = await request(app)
      .delete(full_url("delete-by-ID"))
      .set("Authorization", `Bearer ${token}`)
      .send({
        Id: vod_id,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Successfully deleted _id:" + vod_id,
      data: expect.any(Object),
    });
  });

  // Need to create new VODs for this one
  test.skip("DELETE /delete-multi-by-ID", async () => {
    const res = await request(app)
      .delete(full_url("delete-multi-by-ID"))
      .set("Authorization", `Bearer ${token}`)
      .send({
        Id: [vod_id],
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "1 videos deleted",
      data: {
        errors: [],
        deleted: [vod_id],
      },
    });
  });
});
