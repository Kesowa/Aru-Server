import { SuperAgentTest } from "supertest";
import { CurriedUrl, Login, Logout } from "./utils/utils";

let agent: SuperAgentTest;
beforeAll(async () => (agent = await Login()));
afterAll(async () => await Logout(agent));
const full_url = CurriedUrl("alert");

describe("/alert API", () => {
  const created_alerts: any = [];
  let filePath: string = "";

  test("POST /upload-alert-image", async () => {
    const res = await agent
      .post(full_url("upload-alert-image"))
      .attach("image", "./assets/image.png")
      .expect(201);

    expect(res.body).toMatchObject({
      status: true,
      message: "file uploaded sucessfully",
      file: expect.any(String),
    });

    filePath = res.body.file;
  });

  test("POST /create", async () => {
    const res = await agent
      .post(full_url("create"))
      .send({
        missionId: "6267dd4b2a2d394080a20848",
        flightId: "6267dd4b2a2d394080a20849",
        locationName: "Address of location from image telemetry data",
        locationId: "6123317cdaacac04cdb2d805",
        location: {
          lat: 22,
          long: 23,
        },
        note: "Type can be either Manual or Automated",
        onSite: false,
        image: filePath,
        pcount: 5,
        type: "Manual",
      })
      .expect(201);

    expect(res.body).toMatchObject({
      status: true,
      message: "New alert created",
      data: expect.any(Object),
    });

    created_alerts.push(res.body.data);
  });

  test("POST /manual-upload-alert", async () => {
    const res = await agent
      .post(full_url("manual-upload-alert"))
      .attach("image", "./assets/image.png")
      .field("missionId", "6267dd4b2a2d394080a20848")
      .field("flightId", "6267dd4b2a2d394080a20849")
      .field("locationName", "Address of location")
      .field("locationId", "6123317cdaacac04cdb2d805")
      // .field("location", JSON.stringify({lat: 22, lng: 22})) This field is not being used on client or server
      .field("note", "Some note")
      .field("onSite", false)
      .field("pcount", 5)
      .field("type", "Manual")
      .expect(201);
    expect(res.body).toMatchObject({
      status: true,
      message: "New alert created",
      data: expect.any(Object),
    });

    created_alerts.push(res.body.data);
  });

  test("GET /get-alert-by-ID", async () => {
    {
      const res = await agent
        .post(full_url("manual-upload-alert"))
        .attach("image", "./assets/image.png")
        .field("missionId", "6267dd4b2a2d394080a20848")
        .field("flightId", "6267dd4b2a2d394080a20849")
        .field("locationName", "Address of location")
        .field("locationId", "6123317cdaacac04cdb2d805")
        // .attach("location[lat]", 22)
        // .attach("location[long]", 23)
        .field("note", "Some note")
        .field("onSite", false)
        .field("pcount", 5)
        .field("type", "Manual")
        .expect(201);
      created_alerts.push(res.body.data);
    }
    const res = await agent
      .get(full_url("get-alert-by-ID"))
      .query({
        id: created_alerts[0]._id,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Alert fetched successfully",
      data: expect.any(Array),
    });
  });

  test("GET /get-alerts-By-mission-ID", async () => {
    {
      const res = await agent
        .post(full_url("manual-upload-alert"))
        .attach("image", "./assets/image.png")
        .field("missionId", "6267dd4b2a2d394080a20848")
        .field("flightId", "6267dd4b2a2d394080a20849")
        .field("locationName", "Address of location")
        .field("locationId", "6123317cdaacac04cdb2d805")
        // .attach("location[lat]", 22)
        // .attach("location[long]", 23)
        .field("note", "Some note")
        .field("onSite", false)
        .field("pcount", 5)
        .field("type", "Manual")
        .expect(201);
      created_alerts.push(res.body.data);
    }
    const res = await agent
      .get(full_url("get-alerts-By-mission-ID"))
      .query({
        page: 1,
        limit: 5,
        sortBy: "createdAt:desc",
        alertType: "Manual",
        id: created_alerts[0].missionId,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Alert fetched successfully",
      data: expect.any(Array),
      total: expect.any(Number),
    });
  });

  test("GET /get-alerts-by-location-ID", async () => {
    {
      const res = await agent
        .post(full_url("manual-upload-alert"))
        .attach("image", "./assets/image.png")
        .field("missionId", "6267dd4b2a2d394080a20848")
        .field("flightId", "6267dd4b2a2d394080a20849")
        .field("locationName", "Address of location")
        .field("locationId", "6123317cdaacac04cdb2d805")
        // .attach("location[lat]", 22)
        // .attach("location[long]", 23)
        .field("note", "Some note")
        .field("onSite", false)
        .field("pcount", 5)
        .field("type", "Manual")
        .expect(201);
      created_alerts.push(res.body.data);
    }
    const res = await agent
      .get(full_url("get-alerts-by-location-ID"))
      .query({
        id: created_alerts[0].locationId,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Alert fetched successfully",
      data: expect.any(Array),
    });
  });

  test("GET /get-alerts-By-location-id-pagination", async () => {
    {
      const res = await agent
        .post(full_url("manual-upload-alert"))
        .attach("image", "./assets/image.png")
        .field("missionId", "6267dd4b2a2d394080a20848")
        .field("flightId", "6267dd4b2a2d394080a20849")
        .field("locationName", "Address of location")
        .field("locationId", "6123317cdaacac04cdb2d805")
        // .attach("location[lat]", 22)
        // .attach("location[long]", 23)
        .field("note", "Some note")
        .field("onSite", false)
        .field("pcount", 5)
        .field("type", "Manual")
        .expect(201);
      created_alerts.push(res.body.data);
    }
    const res = await agent
      .get(full_url("get-alerts-By-location-id-pagination"))
      .query({
        page: 1,
        limit: 5,
        sortBy: "createdAt:desc",
        id: "6123317cdaacac04cdb2d805",
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Alert fetched successfully",
      data: expect.any(Array),
      total: expect.any(Number),
    });
  });

  test("GET /get-number-of-alerts-By-location-ID", async () => {
    {
      const res = await agent
        .post(full_url("manual-upload-alert"))
        .attach("image", "./assets/image.png")
        .field("missionId", "6267dd4b2a2d394080a20848")
        .field("flightId", "6267dd4b2a2d394080a20849")
        .field("locationName", "Address of location")
        .field("locationId", "6123317cdaacac04cdb2d805")
        // .attach("location[lat]", 22)
        // .attach("location[long]", 23)
        .field("note", "Some note")
        .field("onSite", false)
        .field("pcount", 5)
        .field("type", "Manual")
        .expect(201);
      created_alerts.push(res.body.data);
    }
    const res = await agent
      .get(full_url("get-number-of-alerts-By-location-ID"))
      .query({
        id: created_alerts[0].locationId,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Alert fetched successfully",
      data: expect.any(Number),
      location: expect.any(Array),
    });
  });

  test("GET /get-alerts-by-flight-or-location-ID", async () => {
    {
      const res = await agent
        .post(full_url("manual-upload-alert"))
        .attach("image", "./assets/image.png")
        .field("missionId", "6267dd4b2a2d394080a20848")
        .field("flightId", "6267dd4b2a2d394080a20849")
        .field("locationName", "Address of location")
        .field("locationId", "6123317cdaacac04cdb2d805")
        // .attach("location[lat]", 22)
        // .attach("location[long]", 23)
        .field("note", "Some note")
        .field("onSite", false)
        .field("pcount", 5)
        .field("type", "Manual")
        .expect(201);
      created_alerts.push(res.body.data);
    }
    const res1 = await agent
      .get(full_url("get-alerts-by-flight-or-location-ID"))
      .query({
        flightID: created_alerts[0].flightId,
      })
      .expect(200);

    expect(res1.body).toMatchObject({
      status: true,
      message: "Alerts fetched successfully",
      data: expect.any(Array),
    });

    const res2 = await agent
      .get(full_url("get-alerts-by-flight-or-location-ID"))
      .query({
        locationID: created_alerts[0].locationId,
      })
      .expect(200);

    expect(res2.body).toMatchObject({
      status: true,
      message: "Alert fetched successfully",
      data: expect.any(Array),
    });
  });

  test("GET /get-alert-by-location-ID-and-time", async () => {
    {
      const res = await agent
        .post(full_url("manual-upload-alert"))
        .attach("image", "./assets/image.png")
        .field("missionId", "6267dd4b2a2d394080a20848")
        .field("flightId", "6267dd4b2a2d394080a20849")
        .field("locationName", "Address of location")
        .field("locationId", "6123317cdaacac04cdb2d805")
        // .attach("location[lat]", 22)
        // .attach("location[long]", 23)
        .field("note", "Some note")
        .field("onSite", false)
        .field("pcount", 5)
        .field("type", "Manual")
        .expect(201);
      created_alerts.push(res.body.data);
    }
    const res = await agent
      .get(full_url("get-alert-by-location-ID-and-time"))
      .query({
        locationID: created_alerts[0].locationId,
        time: "3 days",
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      data: expect.any(Array),
      message:
        "Total Alerts for " +
        created_alerts[0].locationId +
        " is " +
        res.body.data.length,
    });
  });

  test("GET /get-alerts-by-tenantid", async () => {
    {
      const res = await agent
        .post(full_url("manual-upload-alert"))
        .attach("image", "./assets/image.png")
        .field("missionId", "6267dd4b2a2d394080a20848")
        .field("flightId", "6267dd4b2a2d394080a20849")
        .field("locationName", "Address of location")
        .field("locationId", "6123317cdaacac04cdb2d805")
        // .attach("location[lat]", 22)
        // .attach("location[long]", 23)
        .field("note", "Some note")
        .field("onSite", false)
        .field("pcount", 5)
        .field("type", "Manual")
        .expect(201);
      created_alerts.push(res.body.data);
    }
    const res = await agent
      .get(full_url("get-alerts-by-tenantid"))
      .query({
        time: "3 days",
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      data: expect.any(Array),
      message: "Total Alerts are " + res.body.data.length,
      count: expect.any(Array),
    });
  });

  test("GET /get-alerts-by-tenantid-advanced-result", async () => {
    {
      const res = await agent
        .post(full_url("manual-upload-alert"))
        .attach("image", "./assets/image.png")
        .field("missionId", "6267dd4b2a2d394080a20848")
        .field("flightId", "6267dd4b2a2d394080a20849")
        .field("locationName", "Address of location")
        .field("locationId", "6123317cdaacac04cdb2d805")
        // .attach("location[lat]", 22)
        // .attach("location[long]", 23)
        .field("note", "Some note")
        .field("onSite", false)
        .field("pcount", 5)
        .field("type", "Manual")
        .expect(201);
      created_alerts.push(res.body.data);
    }
    await agent
      .get(full_url("get-alerts-by-tenantid-advanced-result"))
      .query({
        page: 1,
        limit: 5,
        timeRange: "2022-07-30 2022-08-01",
        time: "3 days",
        user: created_alerts[0].createdBy,
      })
      .expect(200);
  });

  // test("GET /get-alerts-by-mission-mapref", async () => {})

  test("DELETE /delete-multiple-alerts", async () => {
    {
      const res = await agent
        .post(full_url("manual-upload-alert"))
        .attach("image", "./assets/image.png")
        .field("missionId", "6267dd4b2a2d394080a20848")
        .field("flightId", "6267dd4b2a2d394080a20849")
        .field("locationName", "Address of location")
        .field("locationId", "6123317cdaacac04cdb2d805")
        // .attach("location[lat]", 22)
        // .attach("location[long]", 23)
        .field("note", "Some note")
        .field("onSite", false)
        .field("pcount", 5)
        .field("type", "Manual")
        .expect(201);
      created_alerts.push(res.body.data);
    }
    const created_ids: string[] = created_alerts.map((a) => a._id);
    const res = await agent
      .delete(full_url("delete-multiple-alerts"))
      .send({
        id: created_ids,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Alerts deleted successfully!",
    });
  });
});
