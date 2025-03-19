import { APP_URL, CurriedUrl } from "./utils";
import request from "supertest";
import { faker } from "@faker-js/faker";

const curried = CurriedUrl("admin/tenant");

export async function RegisterTenant() {
  const tenantDetails = {
    name: faker.company.name(),
    phoneNo: faker.phone.number(),
    email: faker.internet.email(),
    contactPerson: faker.name.fullName(),
    registrationNumber: faker.datatype.number(100),
    officialWebsite: faker.internet.url(),
    gstNumber: faker.datatype.number({ min: 1000, max: 9999 }),
    billingAddressLine1: faker.address.streetAddress(),
    // billingAddressLine2: faker.address.secondaryAddress(),
    billingCity: faker.address.city(),
    billingDistrict: faker.address.county(),
    billingState: faker.address.state(),
    billingPin: faker.address.zipCode("######"),
    // avatar: faker.datatype.hexadecimal({}),
    password: faker.internet.password(),
    // package: "gold",
  }
  const registerRes = await request(APP_URL)
    .post(curried("register-tenant"))
    .send(tenantDetails)
    .expect(200);

  expect(registerRes.body).toStrictEqual({
    status: true,
    message: expect.any(String),
  });

  return tenantDetails;
}

