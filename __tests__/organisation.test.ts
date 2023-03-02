import { CurriedUrl, Login } from "../config/utils";
import request from "supertest";
import app from "../src/app";
import { faker } from "@faker-js/faker";

let token: string;
beforeAll(async () => (token = await Login()));
const full_url = CurriedUrl("tenantroot");

describe("/organisation API", () => {
  test("GET /fetch-organisation-details", async () => {
    const res = await request(app)
      .get(full_url("fetch-organisation-details"))
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Tenant details fetched",
      data: expect.any(Object),
    });
  });

  test("POST /update-organisation-details", async () => {
    const res = await request(app)
      .post(full_url("update-organisation-details"))
      .set("Authorization", `Bearer ${token}`)
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
    const res = await request(app)
      .post(full_url("request-otp-for-email-change"))
      .set("Authorization", `Bearer ${token}`)
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
    {
      const res = await request(app)
        .post(full_url("request-otp-for-email-change"))
        .set("Authorization", `Bearer ${token}`)
        .send({
          email: faker.internet.email(),
        })
        .expect(200);
    }
    const res = await request(app)
      .post(full_url("resend-otp-for-email-change"))
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(res.body).toMatchObject({
      status: true,
      message: "OTP sent sucessfully.",
    });
  });

  // test("POST /validate-otp-update-email", async () => {
  //     {
  //         const res = await request(app)
  //         .post(full_url("request-otp-for-email-change"))
  //         .set("Authorization", `Bearer ${token}`)
  //         .send({
  //             email: faker.internet.email()
  //         })
  //         .expect(200);
  //     }
  //     const res = await request(app)
  //         .post(full_url("validate-otp-update-email"))
  //         .set("Authorization", `Bearer ${token}`)
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
