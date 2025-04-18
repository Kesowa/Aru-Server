import { SuperAgentTest } from "supertest";
import { CurriedUrl, Login, LoginSuper, Logout } from "./utils/utils";
import { uploadFile } from "./utils/upload";
import { createAlert } from "./utils/alert";

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
const full_url = CurriedUrl("alert");

describe("/alert API", () => {
  test("POST /common/upload-url", async () => {
    await uploadFile(agent, "./assets/image.png");
  });

  test("POST /create", async () => {
    await createAlert(agent, superAdminAgent);
  });

  test("POST /manual-upload-alert", async () => {
    const fileId = await uploadFile(agent, "./assets/image.png");
    const res = await agent
      .post(full_url("manual-upload-alert"))
      .send({
        file: fileId,
        missionId: "6267dd4b2a2d394080a20848",
        flightId: "6267dd4b2a2d394080a20849",
        locationName: "Address of location",
        locationId: "6123317cdaacac04cdb2d805",
        // location: "JSON.stringify({lat: 22, lng: 22}))", // This field is not being used on client or serve
        note: "Some note",
        onSite: false,
        pcount: 5,
        type: "Manual",
      })
      .expect(201);
    expect(res.body).toMatchObject({
      status: true,
      message: "New alert created",
      data: expect.any(Object),
    });
  });

  test("GET /get-alert-by-ID", async () => {
    const alert = await createAlert(agent, superAdminAgent);
    const res = await agent
      .get(full_url("get-alert-by-ID"))
      .query({
        id: alert._id,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Alert fetched successfully",
      data: expect.any(Array),
    });
  });

  test("GET /get-alerts-By-mission-ID", async () => {
    const alert = await createAlert(agent, superAdminAgent);
    const res = await agent
      .get(full_url("get-alerts-By-mission-ID"))
      .query({
        page: 1,
        limit: 5,
        sortBy: "createdAt:desc",
        alertType: "Manual",
        id: alert.missionId,
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
    const alert = await createAlert(agent, superAdminAgent);
    const res = await agent
      .get(full_url("get-alerts-by-location-ID"))
      .query({
        id: alert.locationId,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Alert fetched successfully",
      data: expect.any(Array),
    });
  });

  test("GET /get-alerts-By-location-id-pagination", async () => {
    const alert = await createAlert(agent, superAdminAgent);
    const res = await agent
      .get(full_url("get-alerts-By-location-id-pagination"))
      .query({
        page: 1,
        limit: 5,
        sortBy: "createdAt:desc",
        id: alert.locationId,
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
    const alert = await createAlert(agent, superAdminAgent);
    const res = await agent
      .get(full_url("get-number-of-alerts-By-location-ID"))
      .query({
        id: alert.locationId,
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
    const alert = await createAlert(agent, superAdminAgent);
    const res1 = await agent
      .get(full_url("get-alerts-by-flight-or-location-ID"))
      .query({
        flightID: alert.flightId,
      })
      .expect(200);

    expect(res1.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: expect.any(Array),
    });

    const res2 = await agent
      .get(full_url("get-alerts-by-flight-or-location-ID"))
      .query({
        locationID: alert.locationId,
      })
      .expect(200);

    expect(res2.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: expect.any(Array),
    });
  });

  test("GET /get-alert-by-location-ID-and-time", async () => {
    const alert = await createAlert(agent, superAdminAgent);
    const res = await agent
      .get(full_url("get-alert-by-location-ID-and-time"))
      .query({
        locationID: alert.locationId,
        time: "3 days",
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      data: expect.any(Array),
      message: expect.any(String),
    });
  });

  test("GET /get-alerts-by-tenantid", async () => {
    await createAlert(agent, superAdminAgent);
    const res = await agent
      .get(full_url("get-alerts-by-tenantid"))
      .query({
        time: "3 days",
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      data: expect.any(Array),
      message: expect.any(String),
      count: expect.any(Number),
    });
  });

  test("GET /get-alerts-by-tenantid-advanced-result", async () => {
    const alert = await createAlert(agent, superAdminAgent);
    await agent
      .get(full_url("get-alerts-by-tenantid-advanced-result"))
      .query({
        page: 1,
        limit: 5,
        timeRange: "2022-07-30 2022-08-01",
        time: "3 days",
        user: alert.createdBy,
      })
      .expect(200);
  });

  // test("GET /get-alerts-by-mission-mapref", async () => {})

  test("DELETE /delete-multiple-alerts", async () => {
    const alerts = [await createAlert(agent, superAdminAgent), await createAlert(agent, superAdminAgent)];
    const created_ids: string[] = alerts.map((a) => a._id);
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
