import { CurriedUrl, Login, Logout } from "./utils/utils";
import {SuperAgentTest} from "supertest";
import { randomUUID } from "crypto";
import { faker } from "@faker-js/faker";

let agent: SuperAgentTest;

beforeAll(async () => (agent = await Login()));
afterAll(async () => await Logout(agent));
const full_url = CurriedUrl("manufacturer");

describe("/manufacturer API", () => {
  test("POST /create", async () => {
    const res = await agent
      .post(full_url("create"))
      .set("userid", "608e7b3ae11f711a34fb0476") // NKDA tenant-root user stored using mongo-init
      .send({
        name: faker.company.name(),
        address: faker.address.streetAddress(),
        nationality: "Indian",
        website: faker.internet.url(),
        contacts: [
          {
            name: faker.name.fullName(),
            designation: randomUUID(),
            Mobile: faker.phone.number("8#########"),
            email: faker.internet.email(),
          },
        ],
      })
      .expect(201);

    expect(res.body).toMatchObject({
      status: true,
      message: "Successfully saved the Manufacturer",
      data: expect.any(Object),
    });
  });

  test("GET /get", async () => {
    await agent
      .post(full_url("create"))
      .set("userid", "608e7b3ae11f711a34fb0476") // NKDA tenant-root user stored using mongo-init
      .send({
        name: faker.company.name(),
        address: faker.address.streetAddress(),
        nationality: "Indian",
        website: faker.internet.url(),
        contacts: [
          {
            name: faker.name.fullName(),
            designation: randomUUID(),
            Mobile: faker.phone.number("8#########"),
            email: faker.internet.email(),
          },
        ],
      })
      .expect(201);

    const res = await agent
      .get(full_url("get"))
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Missions fetched sucessfully.",
      data: expect.any(Array),
    });
  });

  test("GET /get-by-id", async () => {
    const created_manufacturers: any[] = [];
    {
      const res = await agent
        .post(full_url("create"))
        .set("userid", "608e7b3ae11f711a34fb0476") // NKDA tenant-root user stored using mongo-init
        .send({
          name: faker.company.name(),
          address: faker.address.streetAddress(),
          nationality: "Indian",
          website: faker.internet.url(),
          contacts: [
            {
              name: faker.name.fullName(),
              designation: randomUUID(),
              Mobile: faker.phone.number("8#########"),
              email: faker.internet.email(),
            },
          ],
        })
        .expect(201);
      created_manufacturers.push(res.body.data);
    }

    const res = await agent
      .get(full_url("get-by-id"))
      .query({
        _id: created_manufacturers[0]._id,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Manufacturer fetched sucessfully.",
      data: expect.any(Array),
    });
  });

  test("PATCH /update", async () => {
    const created_manufacturers: any[] = [];
    {
      const res = await agent
        .post(full_url("create"))
        .set("userid", "608e7b3ae11f711a34fb0476") // NKDA tenant-root user stored using mongo-init
        .send({
          name: faker.company.name(),
          address: faker.address.streetAddress(),
          nationality: "Indian",
          website: faker.internet.url(),
          contacts: [
            {
              name: faker.name.fullName(),
              designation: randomUUID(),
              Mobile: faker.phone.number("8#########"),
              email: faker.internet.email(),
            },
          ],
        })
        .expect(201);
      created_manufacturers.push(res.body.data);
    }

    const res = await agent
      .patch(full_url("update"))
      .send({
        id: created_manufacturers[0]._id,
        update: {
          nationality: "American",
        },
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Manufacturer updated sucessfully.",
      data: expect.any(Object),
    });
  });

  test("DELETE /delete", async () => {
    const created_manufacturers: any[] = [];
    {
      const res = await agent
        .post(full_url("create"))
        .set("userid", "608e7b3ae11f711a34fb0476") // NKDA tenant-root user stored using mongo-init
        .send({
          name: faker.company.name(),
          address: faker.address.streetAddress(),
          nationality: "Indian",
          website: faker.internet.url(),
          contacts: [
            {
              name: faker.name.fullName(),
              designation: randomUUID(),
              Mobile: faker.phone.number("8#########"),
              email: faker.internet.email(),
            },
          ],
        })
        .expect(201);
      created_manufacturers.push(res.body.data);
    }

    const res = await agent
      .delete(full_url("delete"))
      .send({
        id: created_manufacturers[0]._id,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Manufacturer successfully deleted",
    });
  });
});
