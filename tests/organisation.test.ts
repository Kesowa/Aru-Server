import { ConnectDB, CurriedUrl, DisconnectDB, Login, Logout, USER } from "./utils/utils";
import {SuperAgentTest} from "supertest";
import { faker } from "@faker-js/faker";
import { Mongoose } from "mongoose";

let agent: SuperAgentTest;
beforeAll(async () => (agent = await Login()));
afterAll(async () => await Logout(agent));
const full_url = CurriedUrl("tenantroot");

describe("/organisation API", () => {
  let mongoClient: Mongoose;
  beforeAll(async () => (mongoClient = await ConnectDB()), 60_000);
  afterAll(async () => await DisconnectDB(mongoClient));
  
  test("GET /fetch-organisation-details", async () => {
    const res = await agent
      .get(full_url("fetch-organisation-details"))
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: expect.any(Object),
    });
  });

  test("POST /update-organisation-details", async () => {
    const res = await agent
      .post(full_url("update-organisation-details"))
      .send({
        name: faker.company.name(),
        contactPerson: faker.name.fullName(),
        registrationNumber: faker.random.numeric(3),
        officialWebsite: faker.internet.domainName(),
        gstNumber: faker.random.numeric(3),
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
      message: expect.any(String),
      data: expect.any(Object),
    });
  });

  // NOTE: After running this, email of the tenant will change but that of the tenant-root user won't, so login would still work with previous email
  test("POST /request-otp-for-email-change", async () => {
    const res = await agent
      .post(full_url("request-otp-for-email-change"))
      .send({
        email: faker.internet.email(),
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
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

  test("POST /validate-otp-update-email", async () => {
    await agent
      .post(full_url("request-otp-for-email-change"))
      .send({
        email: faker.internet.email(),
      })
      .expect(200);

    const user = await mongoClient.connection.collection('users').findOne({ email: USER.email });
    const tenant = await mongoClient.connection.collection('tenants').findOne({ _id: user?.tenantId });
    expect(tenant).toBeTruthy();

    const res = await agent
      .post(full_url("validate-otp-update-email"))
      .send({
          otp: tenant?.modefiedEmailRequestedOTPs[0],
      })
      .expect(200);

    expect(res.body).toMatchObject({
        status: true,
        message: expect.any(String),
        data: expect.any(Object)
    });
  });
});
