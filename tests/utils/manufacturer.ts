import { SuperAgentTest } from "supertest";
import { CurriedUrl } from "./utils";
import { faker } from "@faker-js/faker";

const full_url = CurriedUrl("manufacturer");

export async function createManufacturer(agent: SuperAgentTest) {
  const res = await agent
    .post(full_url("create"))
    .send({
      name: faker.company.name(),
      address: faker.address.streetAddress(),
      nationality: faker.address.country(),
      website: faker.internet.url(),
      contacts: [
        {
          name: faker.name.fullName(),
          designation: faker.random.word(),
          Mobile: faker.phone.number("8#########"),
          email: faker.internet.email(),
        },
      ],
    })
    .expect(201);

  expect(res.body).toMatchObject({
    status: true,
    message: expect.any(String),
    data: expect.any(Object),
  });

  return res.body.data;
}
