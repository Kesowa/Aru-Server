import { APP_URL, CurriedUrl } from "./utils";
import request, { SuperAgentTest, SuperTest } from "supertest";
import { faker } from "@faker-js/faker";
import { uploadFile } from "./upload";
import { createPackage } from "./package";
import { Mongoose } from "mongoose";

const full_url = CurriedUrl("admin/tenant");

export async function registerTenant(publicAgent: SuperAgentTest, email?: string) {
  // This is for stage 1 of the signup process of a new tenant
  // This is a public endpoint that doesn't require authentication
  // At this point, avatar can't be set as for setting avatar, file has to be uploaded to the platform, which is not possible until authenticated
  // At this point, package can't be set as package selection comes in a later stage of the signup process
  const tenantDetails = {
    name: faker.company.name(),
    phoneNo: faker.phone.number(),
    email: email ?? faker.internet.email(),
    contactPerson: faker.name.fullName(),
    registrationNumber: faker.datatype.number(100),
    officialWebsite: faker.internet.url(),
    gstNumber: faker.datatype.number({ min: 1000, max: 9999 }),
    billingAddressLine1: faker.address.streetAddress(),
    billingAddressLine2: faker.address.secondaryAddress(),
    billingCity: faker.address.city(),
    billingDistrict: faker.address.county(),
    billingState: faker.address.state(),
    billingPin: "700001", // using hardcoded Kolkata pincode, because faker sometimes generates zipcodes that don't actually exist, which causes HTTP 400
    password: faker.internet.password(),
  }
  const registerRes = await publicAgent
    .post(full_url("register-tenant"))
    .send(tenantDetails)
    .expect(200);

  expect(registerRes.body).toStrictEqual({
    status: true,
    message: expect.any(String),
  });

  return tenantDetails;
}

export async function createTenantPublic(publicAgent: SuperAgentTest, mongoClient: Mongoose) {
  // This process includes registration and verification

  const email = faker.internet.email();

  await registerTenant(publicAgent, email);

  const newTenant = await mongoClient.connection.collection('new_tenants').findOne({ email });
  expect(newTenant).toBeTruthy();

  const res = await publicAgent
  .post(full_url("verify-tenant"))
  .send({
    email,
    verificationCode: newTenant?.verificationCode,
  })
  .expect(200);

  expect(res.body).toStrictEqual({
    status: true,
    message: expect.any(String),
    data: expect.any(Object),
  });

  return res.body.data; // newly registered and verified tenant
}

export async function createTenant(superAdminAgent: SuperAgentTest) {
  // This is used by super-admin user to create a new tenant
  // Thus, avatar upload and package assignment is possible
  const fileId = await uploadFile(superAdminAgent, "./assets/image.png");
  const pack = await createPackage(superAdminAgent);
  const tenantDetails = {
    name: faker.company.name(),
    phoneNo: faker.phone.number(),
    email: faker.internet.email(),
    activePackage: pack._id,
    contactPerson: faker.name.fullName(),
    registrationNumber: faker.datatype.number(100),
    officialWebsite: faker.internet.url(),
    gstNumber: faker.datatype.number({ min: 1000, max: 9999 }),
    billingAddressLine1: faker.address.streetAddress(),
    billingAddressLine2: faker.address.secondaryAddress(),
    billingCity: faker.address.city(),
    billingDistrict: faker.address.county(),
    billingState: faker.address.state(),
    billingPin: "700001", // using hardcoded Kolkata pincode, because faker sometimes generates zipcodes that don't actually exist, which causes HTTP 400
    avatar: fileId,
  }
  const res = await superAdminAgent
    .post(full_url("create"))
    .send(tenantDetails)
    .expect(201);

  expect(res.body).toStrictEqual({
    status: true,
    message: expect.any(String),
    tenantId: expect.any(String),
  });

  return {
    _id: res.body.tenantId,
    ...tenantDetails
  };
}