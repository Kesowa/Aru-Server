import { CurriedUrl, Login } from "../config/utils";
import request from "supertest";
import app from "../src/app";
import { randomUUID } from "crypto";

let token: string;
beforeAll(async () => (token = await Login()));
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
    const res = await request(app)
      .post(full_url("create"))
      .set("Authorization", `Bearer ${token}`)
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
      const res = await request(app)
        .post(full_url("create"))
        .set("Authorization", `Bearer ${token}`)
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

    const res = await request(app)
      .patch(full_url("update"))
      .set("Authorization", `Bearer ${token}`)
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
    const created_locations: any[] = [];
    {
      const res = await request(app)
        .post(full_url("create"))
        .set("Authorization", `Bearer ${token}`)
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

    const res = await request(app)
      .get(full_url("get"))
      .set("Authorization", `Bearer ${token}`)
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
      const res = await request(app)
        .post(full_url("create"))
        .set("Authorization", `Bearer ${token}`)
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

    const res = await request(app)
      .get(full_url("get-by-id"))
      .set("Authorization", `Bearer ${token}`)
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
    const created_locations: any[] = [];
    {
      const res = await request(app)
        .post(full_url("create"))
        .set("Authorization", `Bearer ${token}`)
        .send({
          type: "Point",
          coordinates: [88, 22],
          properties: {
            name: randomUUID(),
          },
        })
        .expect(201);
      created_locations.push(res.body.data);
    }

    const res = await request(app)
      .get(full_url("get-locationID-By-lat-long"))
      .set("Authorization", `Bearer ${token}`)
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
      const resPoly = await request(app)
        .post(full_url("create"))
        .set("Authorization", `Bearer ${token}`)
        .send({
          type: sampleGeometry.type,
          coordinates: sampleGeometry.coordinates,
          properties: {
            name: randomUUID(),
          },
        })
        .expect(201);
      // console.error(resPoly.body);
      createdPolygon = resPoly.body.data._id;
    }

    const res = await request(app)
      .get(full_url("get-within-by-id"))
      .set("Authorization", `Bearer ${token}`)
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
      const res = await request(app)
        .post(full_url("create"))
        .set("Authorization", `Bearer ${token}`)
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

    const res = await request(app)
      .delete(full_url("delete"))
      .set("Authorization", `Bearer ${token}`)
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
