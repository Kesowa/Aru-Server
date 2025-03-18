import { CurriedUrl, Login, Logout } from "./utils/utils";
import {SuperAgentTest} from "supertest";
import { randomUUID } from "crypto";
import fs from "fs/promises";

let agent: SuperAgentTest;
beforeAll(async () => (agent = await Login()));
afterAll(async () => Logout(agent));
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
      "/server/src/public/vod/" + filename,
    );
    const res = await agent
      .post(full_url("save-VOD"))
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
    const res = await agent
      .post(full_url("save-vod-manual"))
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
    await agent
      .post(full_url("save-vod-manual"))
      .field("locationID", "6123317cdaacac04cdb2d805") // exists in db
      .field("missionID", "61f3b1e65f915a05cb8885ec") // exists in db
      .field("flightID", "6267dd4b2a2d394080a20849") // exists in db
      .attach("video", "/server/assets/video.mp4") // doesn't yet exist
      .expect(200);
    const res = await agent
      .patch(full_url("test-vod-inject"))
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
    const res = await agent
      .get(full_url("get-by-missionID"))
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
    const res = await agent
      .get(full_url("get-count-by-missionID"))
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
    const res = await agent
      .get(full_url("get-by-flightID"))
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
    const res = await agent
      .get(full_url("get-by-location-ID"))
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
    const res = await agent
      .patch(full_url("edit-by-ID"))
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
    const res = await agent
      .patch(full_url("insert-tenantID"))
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
    const res = await agent
      .delete(full_url("delete-by-ID"))
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
    const res = await agent
      .delete(full_url("delete-multi-by-ID"))
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
