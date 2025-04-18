import { CurriedUrl, Login, Logout } from "./utils/utils";
import {SuperAgentTest} from "supertest";
import { createLocation } from "./utils/location";
import { faker } from "@faker-js/faker";

let agent: SuperAgentTest;

beforeAll(async () => (agent = await Login()));
afterAll(async () => await Logout(agent));
const full_url = CurriedUrl("location");

describe("/location API", () => {
  test("POST /create", async () => {
    await createLocation(agent);
  });

  test("PATCH /update", async () => {
    const location = await createLocation(agent); // Polygon location

    const res = await agent
      .patch(full_url("update"))
      .send({
        id: location._id,
        // updating "Polygon" geometry to "Point" with first vertex of the previous polygon
        geometry: {
          type: "Point",
          coordinates: location.geometry.coordinates[0][0],
        },
        properties: {
          name: faker.address.streetAddress(),
        },
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: expect.any(Object),
    });
  });

  test("GET /get", async () => {
    await createLocation(agent);

    const res = await agent
      .get(full_url("get"))
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: expect.any(Array),
    });
  });

  test("GET /get-by-id", async () => {
    const location = await createLocation(agent);

    const res = await agent
      .get(full_url("get-by-id"))
      .query({
        id: location._id,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: expect.any(Object),
    });
  });

  test("GET /get-locationID-By-lat-long", async () => {
    const location = await createLocation(agent, "Point");
    const [long, lat] = location.geometry.coordinates;
    console.log("HEREEEE: ", long, lat);

    const res = await agent
      .get(full_url("get-locationID-By-lat-long"))
      .query({
        long,
        lat,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: expect.any(Object),
    });
  });

  test("GET /get-within-by-id", async () => {
    const polygonLocation = await createLocation(agent); // "Polygon" location
    const pointLocation = await createLocation(agent, "Point"); // "Point" location that lies within that "Polygon" location

    const res = await agent
      .get(full_url("get-within-by-id"))
      .query({
        id: polygonLocation._id,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: expect.any(Array),
    });

    expect(res.body.data).toContainEqual(pointLocation);
  });

  test("DELETE /delete", async () => {
    const location = await createLocation(agent);

    const res = await agent
      .delete(full_url("delete"))
      .query({
        id: location._id,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: expect.any(Object),
    });
  });
});
