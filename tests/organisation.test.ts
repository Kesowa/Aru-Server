import { CurriedUrl, Login, Logout } from "./utils/utils";
import {SuperAgentTest} from "supertest";
import { faker } from "@faker-js/faker";

let agent: SuperAgentTest;
beforeAll(async () => (agent = await Login()));
afterAll(async () => await Logout(agent));
const full_url = CurriedUrl("tenantroot");

describe("/organisation API", () => {
  test("GET /fetch-organisation-details", async () => {
    const res = await agent
      .get(full_url("fetch-organisation-details"))
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Tenant details fetched",
      data: expect.any(Object),
    });
  });

  test("POST /update-organisation-details", async () => {
    const res = await agent
      .post(full_url("update-organisation-details"))
      .send({
        name: faker.company.name(),
        contactPerson: faker.name.fullName(),
        registrationNumber: Math.floor(Math.random() * 1000).toString(),
        officialWebsite: faker.internet.domainName(),
        gstNumber: Math.floor(Math.random() * 1000).toString(),
        billingAddressLine1: faker.address.secondaryAddress(),
        billingAddressLine2: faker.address.streetAddress(),
        billingCity: faker.address.cityName(),
        billingDistrict: faker.address.city(),
        billingState: faker.address.state(),
        billingPin: "700001",
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Organisation updated sucessfully.",
      data: expect.any(Object),
    });
  });

  test("POST /request-otp-for-email-change", async () => {
    const res = await agent
      .post(full_url("request-otp-for-email-change"))
      .send({
        email: faker.internet.email(),
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "OTP generated sucessfully",
    });
  });

  test("POST /resend-otp-for-email-change", async () => {
    await agent
      .post(full_url("request-otp-for-email-change"))
      .send({
        email: faker.internet.email(),
      })
      .expect(200);
    const res = await agent
      .post(full_url("resend-otp-for-email-change"))
      .expect(200);
    expect(res.body).toMatchObject({
      status: true,
      message: "OTP sent sucessfully.",
    });
  });

  // test("POST /validate-otp-update-email", async () => {
  //     {
  //         const res = await agent
  //         .post(full_url("request-otp-for-email-change"))
  //         .send({
  //             email: faker.internet.email()
  //         })
  //         .expect(200);
  //     }
  //     const res = await agent
  //         .post(full_url("validate-otp-update-email"))
  //         .send({
  //             otp: Math.floor(Math.random()*1000000).toString()
  //         })
  //         .expect(200);

  //     expect(res.body).toMatchObject({
  //         status: true,
  //         message: "Email updated sucessfully.",
  //         data: expect.any(Object)
  //     });
  // });
});
