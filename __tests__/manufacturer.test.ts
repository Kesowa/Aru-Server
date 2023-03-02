import { CurriedUrl, Login } from "../config/utils";
import request from "supertest";
import app from "../src/app";
import { randomUUID } from "crypto";
import { faker } from "@faker-js/faker";

let token: string;
beforeAll(async () => (token = await Login()));
const full_url = CurriedUrl("manufacturer");

describe("/manufacturer API", () => {
  test("POST /create", async () => {
    const res = await request(app)
      .post(full_url("create"))
      .set("Authorization", `Bearer ${token}`)
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
    const created_manufacturers: any[] = [];
    {
      const res = await request(app)
        .post(full_url("create"))
        .set("Authorization", `Bearer ${token}`)
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

    const res = await request(app)
      .get(full_url("get"))
      .set("Authorization", `Bearer ${token}`)
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
      const res = await request(app)
        .post(full_url("create"))
        .set("Authorization", `Bearer ${token}`)
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

    const res = await request(app)
      .get(full_url("get-by-id"))
      .set("Authorization", `Bearer ${token}`)
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
      const res = await request(app)
        .post(full_url("create"))
        .set("Authorization", `Bearer ${token}`)
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

    const res = await request(app)
      .patch(full_url("update"))
      .set("Authorization", `Bearer ${token}`)
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
      const res = await request(app)
        .post(full_url("create"))
        .set("Authorization", `Bearer ${token}`)
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

    const res = await request(app)
      .delete(full_url("delete"))
      .set("Authorization", `Bearer ${token}`)
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
