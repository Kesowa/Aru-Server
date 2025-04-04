import { CurriedUrl, Login, Logout } from "./utils/utils";
import {SuperAgentTest} from "supertest";
import { randomUUID } from "crypto";

let agent: SuperAgentTest;

const full_url = CurriedUrl("mission");

describe("/mission API", () => {
  beforeAll(async () => (agent = await Login()));
  afterAll(async () => await Logout(agent));

  test("POST /create", async () => {
    const res = await agent
      .post(full_url("create"))
      .send({
        name: randomUUID(),
        description: randomUUID(),
        deliverables: ["Live Feed", "Thermal"],
        assetId: "none",
        flights: [
          {
            flightDetails: {
              locationId: "6123317cdaacac04cdb2d805",
              flightName: randomUUID(),
              date: "2022-09-15",
              time: "05:30:00 PM",
              duration: "1hr",
              centerPoints: {
                lat: 22.55,
                lng: 88.48,
              },
              geoLocation: randomUUID(),
            },
          },
        ],
        missionType: "60cc7d408fb1793e8c76d4a3",
        clientId: [
          "608e7b3ae11f711a34fb0476", // NKDA tenant-root
          "614ec3dcd44bea14a721326a", // Kesowa super-admin
        ],
      })
      .expect(201);

    expect(res.body).toMatchObject({
      status: true,
      message: "New mission created",
      data: expect.any(Object),
    });
  });

  test("POST /mission-by-userid", async () => {
    await agent
      .post(full_url("create"))
      .send({
        name: randomUUID(),
        description: randomUUID(),
        deliverables: ["Live Feed", "Thermal"],
        assetId: "none",
        flights: [
          {
            flightDetails: {
              locationId: "6123317cdaacac04cdb2d805",
              flightName: randomUUID(),
              date: "2022-09-15",
              time: "05:30:00 PM",
              duration: "1hr",
              centerPoints: {
                lat: 22.55,
                lng: 88.48,
              },
              geoLocation: randomUUID(),
            },
          },
        ],
        missionType: "60cc7d408fb1793e8c76d4a3",
        clientId: [
          "608e7b3ae11f711a34fb0476", // NKDA tenant-root
          "614ec3dcd44bea14a721326a", // Kesowa super-admin
        ],
      })
      .expect(201);
    const res = await agent
      .post(full_url("mission-by-userid"))
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Missions fetched sucessfully.",
      data: expect.any(Array),
    });
  });

  test("GET /get/tenant", async () => {
    const created_missions: any[] = [];
    {
      const res = await agent
        .post(full_url("create"))
        .send({
          name: randomUUID(),
          description: randomUUID(),
          deliverables: ["Live Feed", "Thermal"],
          assetId: "none",
          flights: [
            {
              flightDetails: {
                locationId: "6123317cdaacac04cdb2d805",
                flightName: randomUUID(),
                date: "2022-09-15",
                time: "05:30:00 PM",
                duration: "1hr",
                centerPoints: {
                  lat: 22.55,
                  lng: 88.48,
                },
                geoLocation: randomUUID(),
              },
            },
          ],
          missionType: "60cc7d408fb1793e8c76d4a3",
          clientId: [
            "608e7b3ae11f711a34fb0476", // NKDA tenant-root
            "614ec3dcd44bea14a721326a", // Kesowa super-admin
          ],
        })
        .expect(201);
      created_missions.push(res.body.data.mission);
    }
    const res = await agent
      .get(full_url("get/tenant"))
      .query({
        filter: "all",
        missionType: created_missions[0].missionType,
        client: "true",
        sort: "createdAt:descend",
        page: "1",
        limit: "10",
        // searchFilters: "" // Didn't understand format properly
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Here are all the missions",
      data: expect.any(Array),
    });
  });

  test("GET /get/user/:id", async () => {
    await agent
      .post(full_url("create"))
      .send({
        name: randomUUID(),
        description: randomUUID(),
        deliverables: ["Live Feed", "Thermal"],
        assetId: "none",
        flights: [
          {
            flightDetails: {
              locationId: "6123317cdaacac04cdb2d805",
              flightName: randomUUID(),
              date: "2022-09-15",
              time: "05:30:00 PM",
              duration: "1hr",
              centerPoints: {
                lat: 22.55,
                lng: 88.48,
              },
              geoLocation: randomUUID(),
            },
          },
        ],
        missionType: "60cc7d408fb1793e8c76d4a3",
        clientId: [
          "608e7b3ae11f711a34fb0476", // NKDA tenant-root
          "614ec3dcd44bea14a721326a", // Kesowa super-admin
        ],
      })
      .expect(201);
    const res = await agent
      .get(full_url("get/user/608e7b3ae11f711a34fb0476"))
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Missions fetched sucessfully.",
      data: expect.any(Array),
    });
  });

  test("GET /get/:id", async () => {
    const created_missions: any[] = [];
    {
      const res = await agent
        .post(full_url("create"))
        .send({
          name: randomUUID(),
          description: randomUUID(),
          deliverables: ["Live Feed", "Thermal"],
          assetId: "none",
          flights: [
            {
              flightDetails: {
                locationId: "6123317cdaacac04cdb2d805",
                flightName: randomUUID(),
                date: "2022-09-15",
                time: "05:30:00 PM",
                duration: "1hr",
                centerPoints: {
                  lat: 22.55,
                  lng: 88.48,
                },
                geoLocation: randomUUID(),
              },
            },
          ],
          missionType: "60cc7d408fb1793e8c76d4a3",
          clientId: [
            "608e7b3ae11f711a34fb0476", // NKDA tenant-root
            "614ec3dcd44bea14a721326a", // Kesowa super-admin
          ],
        })
        .expect(201);
      created_missions.push(res.body.data.mission);
    }
    const res = await agent
      .get(full_url("get/" + created_missions[0]._id))
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Mission fetched",
      data: expect.any(Object),
    });
  });

  // FIXED: Check commit for more info
  test("GET /filtered-mission", async () => {
    await agent
      .post(full_url("create"))
      .send({
        name: randomUUID(),
        description: randomUUID(),
        deliverables: ["Live Feed", "Thermal"],
        assetId: "none",
        flights: [
          {
            flightDetails: {
              locationId: "6123317cdaacac04cdb2d805",
              flightName: randomUUID(),
              date: "2022-09-15",
              time: "05:30:00 PM",
              duration: "1hr",
              centerPoints: {
                lat: 22.55,
                lng: 88.48,
              },
              geoLocation: randomUUID(),
            },
          },
        ],
        missionType: "60cc7d408fb1793e8c76d4a3",
        clientId: [
          "608e7b3ae11f711a34fb0476", // NKDA tenant-root
          "614ec3dcd44bea14a721326a", // Kesowa super-admin
        ],
      })
      .expect(201);
    const res = await agent
      .get(full_url("filtered-mission"))
      .query({
        status: "All",
        date: "2022-09-15",
        // startDate: "2022-09-10",
        // endDate: "2022-09-20",
        page: "1",
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Flight fetched sucessfully.",
      totalPages: expect.any(Number),
      data: expect.any(Array),
    });
  });

  test("GET /autocomplete", async () => {
    await agent
      .post(full_url("create"))
      .send({
        name: "New Text Mission",
        description:
          "This mission's data is hard coded sothat given query is found",
        deliverables: ["Live Feed", "Thermal"],
        assetId: "none",
        flights: [
          {
            flightDetails: {
              locationId: "6123317cdaacac04cdb2d805",
              flightName: randomUUID(),
              date: "2022-09-15",
              time: "05:30:00 PM",
              duration: "1hr",
              centerPoints: {
                lat: 22.55,
                lng: 88.48,
              },
              geoLocation: randomUUID(),
            },
          },
        ],
        missionType: "60cc7d408fb1793e8c76d4a3",
        clientId: [
          "608e7b3ae11f711a34fb0476", // NKDA tenant-root
          "614ec3dcd44bea14a721326a", // Kesowa super-admin
        ],
      })
      .expect(201);
    const res = await agent
      .get(full_url("autocomplete"))
      .query({
        query: "mission",
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Result found : " + res.body.data.length,
      data: expect.any(Array),
    });
  });

  test("GET /get-total-number-of-mission-by-locationID", async () => {
    const created_flights: any[] = [];
    {
      const res = await agent
        .post(full_url("create"))
        .send({
          name: randomUUID(),
          description: randomUUID(),
          deliverables: ["Live Feed", "Thermal"],
          assetId: "none",
          flights: [
            {
              flightDetails: {
                locationId: "6123317cdaacac04cdb2d805",
                flightName: randomUUID(),
                date: "2022-09-15",
                time: "05:30:00 PM",
                duration: "1hr",
                centerPoints: {
                  lat: 22.55,
                  lng: 88.48,
                },
                geoLocation: randomUUID(),
              },
            },
          ],
          missionType: "60cc7d408fb1793e8c76d4a3",
          clientId: [
            "608e7b3ae11f711a34fb0476", // NKDA tenant-root
            "614ec3dcd44bea14a721326a", // Kesowa super-admin
          ],
        })
        .expect(201);
      created_flights.push(res.body.data.flight);
    }
    const res = await agent
      .get(full_url("get-total-number-of-mission-by-locationID"))
      .query({
        id: created_flights[0].locationID,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Number of mission data fetched successfully!",
      data: expect.any(Number),
    });
  });

  test("GET /get-missions-by-location-mapref", async () => {
    const created_flights: any[] = [];
    {
      const res = await agent
        .post(full_url("create"))
        .send({
          name: randomUUID(),
          description: randomUUID(),
          deliverables: ["Live Feed", "Thermal"],
          assetId: "none",
          flights: [
            {
              flightDetails: {
                locationId: "6123317cdaacac04cdb2d805",
                flightName: randomUUID(),
                date: "2022-09-15",
                time: "05:30:00 PM",
                duration: "1hr",
                centerPoints: {
                  lat: 22.55,
                  lng: 88.48,
                },
                geoLocation: randomUUID(),
              },
            },
          ],
          missionType: "60cc7d408fb1793e8c76d4a3",
          clientId: [
            "608e7b3ae11f711a34fb0476", // NKDA tenant-root
            "614ec3dcd44bea14a721326a", // Kesowa super-admin
          ],
        })
        .expect(201);
      created_flights.push(res.body.data.flight);
    }
    const res = await agent
      .get(full_url("get-missions-by-location-mapref"))
      .query({
        id: created_flights[0].locationID,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: " mission data fetched successfully!",
      data: expect.any(Array),
    });
  });

  test("GET /get-missions-by-locationID", async () => {
    const created_missions: any[] = [];
    const created_flights: any[] = [];
    {
      const res = await agent
        .post(full_url("create"))
        .send({
          name: randomUUID(),
          description: randomUUID(),
          deliverables: ["Live Feed", "Thermal"],
          assetId: "none",
          flights: [
            {
              flightDetails: {
                locationId: "6123317cdaacac04cdb2d805",
                flightName: randomUUID(),
                date: "2022-09-15",
                time: "05:30:00 PM",
                duration: "1hr",
                centerPoints: {
                  lat: 22.55,
                  lng: 88.48,
                },
                geoLocation: randomUUID(),
              },
            },
          ],
          missionType: "60cc7d408fb1793e8c76d4a3",
          clientId: [
            "608e7b3ae11f711a34fb0476", // NKDA tenant-root
            "614ec3dcd44bea14a721326a", // Kesowa super-admin
          ],
        })
        .expect(201);
      created_missions.push(res.body.data.mission);
      created_flights.push(res.body.data.flight);
    }
    const res = await agent
      .get(full_url("get-missions-by-locationID"))
      .query({
        missionID: created_missions[0]._id,
        locationID: created_flights[0].locationID,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Fetched missions by locationID",
      data: expect.any(Array),
    });
  });

  test("GET /get-mission-csv-for-tenant-Or-user", async () => {
    const created_missions: any[] = [];
    {
      const res = await agent
        .post(full_url("create"))
        .send({
          name: randomUUID(),
          description: randomUUID(),
          deliverables: ["Live Feed", "Thermal"],
          assetId: "none",
          flights: [
            {
              flightDetails: {
                locationId: "6123317cdaacac04cdb2d805",
                flightName: randomUUID(),
                date: "2022-09-15",
                time: "05:30:00 PM",
                duration: "1hr",
                centerPoints: {
                  lat: 22.55,
                  lng: 88.48,
                },
                geoLocation: randomUUID(),
              },
            },
          ],
          missionType: "60cc7d408fb1793e8c76d4a3",
          clientId: [
            "608e7b3ae11f711a34fb0476", // NKDA tenant-root
            "614ec3dcd44bea14a721326a", // Kesowa super-admin
          ],
        })
        .expect(201);
      created_missions.push(res.body.data.mission);
    }
    const res = await agent
      .get(full_url("get-mission-csv-for-tenant-Or-user"))
      .send({
        userId: created_missions[0].user,
        status: created_missions[0].status,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Successfully csv file created!",
      pathh: expect.any(String),
    });
  });

  test("GET /memory-usage/:id", async () => {
    const created_missions: any[] = [];
    {
      const res = await agent
        .post(full_url("create"))
        .send({
          name: randomUUID(),
          description: randomUUID(),
          deliverables: ["Live Feed", "Thermal"],
          assetId: "none",
          flights: [
            {
              flightDetails: {
                locationId: "6123317cdaacac04cdb2d805",
                flightName: randomUUID(),
                date: "2022-09-15",
                time: "05:30:00 PM",
                duration: "1hr",
                centerPoints: {
                  lat: 22.55,
                  lng: 88.48,
                },
                geoLocation: randomUUID(),
              },
            },
          ],
          missionType: "60cc7d408fb1793e8c76d4a3",
          clientId: [
            "608e7b3ae11f711a34fb0476", // NKDA tenant-root
            "614ec3dcd44bea14a721326a", // Kesowa super-admin
          ],
        })
        .expect(201);
      created_missions.push(res.body.data.mission);
    }
    const res = await agent
      .get(full_url("memory-usage/" + created_missions[0]._id))
      .query({
        missionId: created_missions[0]._id,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "mission data usage",
      data: expect.any(Array),
    });
  });

  test("POST /edit", async () => {
    const created_missions: any[] = [];
    {
      const res = await agent
        .post(full_url("create"))
        .send({
          name: randomUUID(),
          description: randomUUID(),
          deliverables: ["Live Feed", "Thermal"],
          assetId: "none",
          flights: [
            {
              flightDetails: {
                locationId: "6123317cdaacac04cdb2d805",
                flightName: randomUUID(),
                date: "2022-09-15",
                time: "05:30:00 PM",
                duration: "1hr",
                centerPoints: {
                  lat: 22.55,
                  lng: 88.48,
                },
                geoLocation: randomUUID(),
              },
            },
          ],
          missionType: "60cc7d408fb1793e8c76d4a3",
          clientId: [
            "608e7b3ae11f711a34fb0476", // NKDA tenant-root
            "614ec3dcd44bea14a721326a", // Kesowa super-admin
          ],
        })
        .expect(201);
      created_missions.push(res.body.data.mission);
    }
    const res = await agent
      .post(full_url("edit"))
      .send({
        id: created_missions[0]._id,
        name: randomUUID(),
        description: randomUUID(),
        deliverables: ["Thermal", "Orthomosaic"],
        type: "5f4771e3976282570dbfffc8",
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: expect.any(Object),
    });
  });

  test("PATCH /update-status", async () => {
    const created_missions: any[] = [];
    {
      const res = await agent
        .post(full_url("create"))
        .send({
          name: randomUUID(),
          description: randomUUID(),
          deliverables: ["Live Feed", "Thermal"],
          assetId: "none",
          flights: [
            {
              flightDetails: {
                locationId: "6123317cdaacac04cdb2d805",
                flightName: randomUUID(),
                date: "2022-09-15",
                time: "05:30:00 PM",
                duration: "1hr",
                centerPoints: {
                  lat: 22.55,
                  lng: 88.48,
                },
                geoLocation: randomUUID(),
              },
            },
          ],
          missionType: "60cc7d408fb1793e8c76d4a3",
          clientId: [
            "608e7b3ae11f711a34fb0476", // NKDA tenant-root
            "614ec3dcd44bea14a721326a", // Kesowa super-admin
          ],
        })
        .expect(201);
      created_missions.push(res.body.data.mission);
    }
    const res = await agent
      .patch(full_url("update-status"))
      .send({
        missionID: created_missions[0]._id,
        status: "Completed",
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Mission completed for missionID : " + created_missions[0]._id,
    });
  });

  test("POST /insert-missiontype-by-Id", async () => {
    const created_missions: any[] = [];
    {
      const res = await agent
        .post(full_url("create"))
        .send({
          name: randomUUID(),
          description: randomUUID(),
          deliverables: ["Live Feed", "Thermal"],
          assetId: "none",
          flights: [
            {
              flightDetails: {
                locationId: "6123317cdaacac04cdb2d805",
                flightName: randomUUID(),
                date: "2022-09-15",
                time: "05:30:00 PM",
                duration: "1hr",
                centerPoints: {
                  lat: 22.55,
                  lng: 88.48,
                },
                geoLocation: randomUUID(),
              },
            },
          ],
          missionType: "60cc7d408fb1793e8c76d4a3",
          clientId: [
            "608e7b3ae11f711a34fb0476", // NKDA tenant-root
            "614ec3dcd44bea14a721326a", // Kesowa super-admin
          ],
        })
        .expect(201);
      created_missions.push(res.body.data.mission);
    }
    const res = await agent
      .post(full_url("insert-missiontype-by-Id"))
      .send({
        id: created_missions[0]._id,
        missionType: "5f4771e3976282570dbfffc8",
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Successfully data updated!",
    });
  });

  test("POST /delete", async () => {
    const created_missions: any[] = [];
    {
      const res = await agent
        .post(full_url("create"))
        .send({
          name: randomUUID(),
          description: randomUUID(),
          deliverables: ["Live Feed", "Thermal"],
          assetId: "none",
          flights: [
            {
              flightDetails: {
                locationId: "6123317cdaacac04cdb2d805",
                flightName: randomUUID(),
                date: "2022-09-15",
                time: "05:30:00 PM",
                duration: "1hr",
                centerPoints: {
                  lat: 22.55,
                  lng: 88.48,
                },
                geoLocation: randomUUID(),
              },
            },
          ],
          missionType: "60cc7d408fb1793e8c76d4a3",
          clientId: [
            "608e7b3ae11f711a34fb0476", // NKDA tenant-root
            "614ec3dcd44bea14a721326a", // Kesowa super-admin
          ],
        })
        .expect(201);
      created_missions.push(res.body.data.mission);
    }
    const res = await agent
      .post(full_url("delete"))
      .send({
        _id: created_missions[0]._id,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Mission deleted",
      data: expect.any(Object),
    });
  });
});
