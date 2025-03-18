import { CurriedUrl, Login, Logout } from "./utils/utils";
import {SuperAgentTest} from "supertest";
import { randomUUID } from "crypto";

let agent: SuperAgentTest;

beforeAll(async () => (agent = await Login()));
afterAll(async () => await Logout(agent));
const full_url = CurriedUrl("location");

const sampleGeometry = {
  type: "Polygon",
  coordinates: [
    [
      [88.47412616159087, 22.576572985349607],
      [88.47393132628888, 22.57600845615178],
      [88.47422357924162, 22.57593711438538],
      [88.47440161839664, 22.576476829440843],
      [88.47412616159087, 22.576572985349607],
    ],
  ],
};

describe("/location API", () => {
  test("POST /create", async () => {
    const res = await agent
      .post(full_url("create"))
      .send({
        type: sampleGeometry.type,
        coordinates: sampleGeometry.coordinates,
        properties: {
          name: randomUUID(),
        },
      })
      .expect(201);

    expect(res.body).toMatchObject({
      status: true,
      data: expect.any(Object),
      message: `New Location saved with ObjectId: ${res.body.data._id}`,
    });
  });

  test("PATCH /update", async () => {
    const created_locations: any[] = [];
    {
      const res = await agent
        .post(full_url("create"))
        .send({
          type: sampleGeometry.type,
          coordinates: sampleGeometry.coordinates,
          properties: {
            name: randomUUID(),
          },
        })
        .expect(201);
      created_locations.push(res.body.data);
    }

    const res = await agent
      .patch(full_url("update"))
      .send({
        id: created_locations[0]._id,
        type: sampleGeometry.type,
        properties: {
          name: randomUUID(),
        },
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: `Location Id : ${created_locations[0]._id} updated`,
      data: expect.any(Object),
    });
  });

  test("GET /get", async () => {
    await agent
      .post(full_url("create"))
      .send({
        type: sampleGeometry.type,
        coordinates: sampleGeometry.coordinates,
        properties: {
          name: randomUUID(),
        },
      })
      .expect(201);

    const res = await agent
      .get(full_url("get"))
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Sucessfully fetched all locations",
      data: expect.any(Array),
    });
  });

  test("GET /get-by-id", async () => {
    const created_locations: any[] = [];
    {
      const res = await agent
        .post(full_url("create"))
        .send({
          type: sampleGeometry.type,
          coordinates: sampleGeometry.coordinates,
          properties: {
            name: randomUUID(),
          },
        })
        .expect(201);
      created_locations.push(res.body.data);
    }

    const res = await agent
      .get(full_url("get-by-id"))
      .query({
        id: created_locations[0]._id,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: `Successfully Fetched ${created_locations[0]._id}`,
      data: expect.any(Object),
    });
  });

  test("GET /get-locationID-By-lat-long", async () => {
    await agent
      .post(full_url("create"))
      .send({
        type: "Point",
        coordinates: [88, 22],
        properties: {
          name: randomUUID(),
        },
      })
      .expect(201);

    const res = await agent
      .get(full_url("get-locationID-By-lat-long"))
      .query({
        long: 88,
        lat: 22,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "fetch successfully location data",
      data: {
        locationId: expect.any(String),
      },
    });
  });

  // API endpoint unstable, will have to research more
  test.skip("GET /get-within-by-id", async () => {
    let createdPolygon: string;
    {
      const resPoly = await agent
        .post(full_url("create"))
        .send({
          type: sampleGeometry.type,
          coordinates: sampleGeometry.coordinates,
          properties: {
            name: randomUUID(),
          },
        })
        .expect(201);
      createdPolygon = resPoly.body.data._id;
    }

    const res = await agent
      .get(full_url("get-within-by-id"))
      .query({
        id: createdPolygon,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: `Sucessfully fetched places for ObjectId: ${createdPolygon}`,
      data: expect.any(Object),
    });
  });

  test("DELETE /delete", async () => {
    const created_locations: any[] = [];
    {
      const res = await agent
        .post(full_url("create"))
        .send({
          type: sampleGeometry.type,
          coordinates: sampleGeometry.coordinates,
          properties: {
            name: randomUUID(),
          },
        })
        .expect(201);
      created_locations.push(res.body.data);
    }

    const res = await agent
      .delete(full_url("delete"))
      .query({
        id: created_locations[0]._id,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: `Sucessfully deleted doc with id: ${created_locations[0]._id}`,
      data: expect.any(Object),
    });
  });
});
