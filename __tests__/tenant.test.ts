import { CurriedUrl, LoginSuper } from "../config/utils";
import request from "supertest";
import app from "../src/app";
import { randomUUID } from "crypto";
import { faker } from "@faker-js/faker";

let token: string;
beforeAll(async () => (token = await LoginSuper()));
const full_url = CurriedUrl("admin/tenant");

const fakeTenant = {
  contactPerson: faker.name.fullName(),
  registrationNumber: Math.floor(Math.random() * 1000),
  officialWebsite: faker.internet.domainName(),
  gstNumber: Math.floor(Math.random() * 1000),
  billingAddressLine1: faker.address.secondaryAddress(),
  billingAddressLine2: faker.address.streetName(),
  billingCity: faker.address.cityName(),
  billingDistrict: faker.address.cityName(),
  billingState: faker.address.state(),
  billingPin: faker.address.zipCode("7#####"),
};

describe("/tenant API", () => {
  test("POST /upload-avatar", async () => {
    const res = await request(app)
      .post(full_url("upload-avatar"))
      .set("Authorization", `Bearer ${token}`)
      .attach("avatar", "/server/assets/image.png")
      .expect(201);

    expect(res.body).toMatchObject({
      status: true,
      message: "file uploaded sucessfully",
      file: expect.any(String),
    });
  });

  test("POST /create", async () => {
    let filePath: string = "";
    {
      const res = await request(app)
        .post(full_url("upload-avatar"))
        .set("Authorization", `Bearer ${token}`)
        .attach("avatar", "/server/assets/image.png")
        .expect(201);
      filePath = res.body.file;
    }
    const res = await request(app)
      .post(full_url("create"))
      .set("Authorization", `Bearer ${token}`)
      .send({
        ...fakeTenant,
        name: faker.name.fullName(),
        phoneNo: faker.phone.number("8#########"),
        email: faker.internet.email(),
        activePackage: "608e7a7ee11f711a34fb0474", // exists in db
        avatar: filePath,
      })
      .expect(201);

    expect(res.body).toMatchObject({
      status: true,
      message: "Tenant created sucessfully.",
      tenantId: expect.any(String),
    });
  });

  test("POST /register-tenant", async () => {
    let filePath: string = "";
    {
      const res = await request(app)
        .post(full_url("upload-avatar"))
        .set("Authorization", `Bearer ${token}`)
        .attach("avatar", "/server/assets/image.png")
        .expect(201);
      filePath = res.body.file;
    }
    const res = await request(app)
      .post(full_url("register-tenant"))
      .set("Authorization", `Bearer ${token}`)
      .send({
        ...fakeTenant,
        name: faker.name.fullName(),
        phoneNo: faker.phone.number("8#########"),
        email: faker.internet.email(),
        package: "608e7a7ee11f711a34fb0474", // exists in db
        avatar: filePath,
        password: randomUUID(),
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Verification code has been sent to your email.",
    });
  });

  test("POST /resend-verification-code", async () => {
    let filePath: string = "";
    const testEmail = faker.internet.email();
    {
      const res = await request(app)
        .post(full_url("upload-avatar"))
        .set("Authorization", `Bearer ${token}`)
        .attach("avatar", "/server/assets/image.png")
        .expect(201);
      filePath = res.body.file;

      await request(app)
        .post(full_url("register-tenant"))
        .set("Authorization", `Bearer ${token}`)
        .send({
          ...fakeTenant,
          name: faker.name.fullName(),
          phoneNo: faker.phone.number("8#########"),
          email: testEmail,
          package: "608e7a7ee11f711a34fb0474", // exists in db
          avatar: filePath,
          password: randomUUID(),
        })
        .expect(200);
    }
    const res = await request(app)
      .post(full_url("resend-verification-code"))
      .set("Authorization", `Bearer ${token}`)
      .send({
        email: testEmail,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Verification code sent",
    });
  });

  test("GET /fetch-active-package-public", async () => {
    const res = await request(app)
      .get(full_url("fetch-active-package-public"))
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Package fetched sucessfully.",
      data: expect.any(Array),
    });
  });

  test("GET /fetchall", async () => {
    let filePath: string = "";
    {
      const res = await request(app)
        .post(full_url("upload-avatar"))
        .set("Authorization", `Bearer ${token}`)
        .attach("avatar", "/server/assets/image.png")
        .expect(201);
      filePath = res.body.file;

      await request(app)
        .post(full_url("create"))
        .set("Authorization", `Bearer ${token}`)
        .send({
          ...fakeTenant,
          name: faker.name.fullName(),
          phoneNo: faker.phone.number("8#########"),
          email: faker.internet.email(),
          activePackage: "608e7a7ee11f711a34fb0474", // exists in db
          avatar: filePath,
        })
        .expect(201);
    }
    const res = await request(app)
      .get(full_url("fetchall"))
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Tenants fetched sucessfully.",
      data: expect.any(Array),
    });
  });

  test("POST /add-initial-package", async () => {
    let filePath: string = "";
    const created_tenants: string[] = [];
    {
      const res = await request(app)
        .post(full_url("upload-avatar"))
        .set("Authorization", `Bearer ${token}`)
        .attach("avatar", "/server/assets/image.png")
        .expect(201);
      filePath = res.body.file;

      const res2 = await request(app)
        .post(full_url("create"))
        .set("Authorization", `Bearer ${token}`)
        .send({
          ...fakeTenant,
          name: faker.name.fullName(),
          phoneNo: faker.phone.number("8#########"),
          email: faker.internet.email(),
          activePackage: "608e7a7ee11f711a34fb0474", // exists in db
          avatar: filePath,
        })
        .expect(201);
      created_tenants.push(res2.body.tenantId);
    }
    const res = await request(app)
      .post(full_url("add-initial-package"))
      .set("Authorization", `Bearer ${token}`)
      .send({
        tenantId: created_tenants[0],
        packageId: "608e7a7ee11f711a34fb0474", // exists in db
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Package added sucessfully.",
    });
  });

  test("PATCH /edit-tenant", async () => {
    let filePath: string = "";
    const created_tenants: string[] = [];
    {
      const res = await request(app)
        .post(full_url("upload-avatar"))
        .set("Authorization", `Bearer ${token}`)
        .attach("avatar", "/server/assets/image.png")
        .expect(201);
      filePath = res.body.file;

      const res2 = await request(app)
        .post(full_url("create"))
        .set("Authorization", `Bearer ${token}`)
        .send({
          ...fakeTenant,
          name: faker.name.fullName(),
          phoneNo: faker.phone.number("8#########"),
          email: faker.internet.email(),
          activePackage: "608e7a7ee11f711a34fb0474", // exists in db
          avatar: filePath,
        })
        .expect(201);
      created_tenants.push(res2.body.tenantId);
    }
    const res = await request(app)
      .patch(full_url("edit-tenant"))
      .set("Authorization", `Bearer ${token}`)
      .send({
        tenantId: created_tenants[0],
        name: randomUUID(),
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Data updated Successfully!",
      data: expect.any(Object),
    });
  });

  test("POST /fetch-tenant-details", async () => {
    let filePath: string = "";
    const created_tenants: string[] = [];
    {
      const res = await request(app)
        .post(full_url("upload-avatar"))
        .set("Authorization", `Bearer ${token}`)
        .attach("avatar", "/server/assets/image.png")
        .expect(201);
      filePath = res.body.file;

      const res2 = await request(app)
        .post(full_url("create"))
        .set("Authorization", `Bearer ${token}`)
        .send({
          ...fakeTenant,
          name: faker.name.fullName(),
          phoneNo: faker.phone.number("8#########"),
          email: faker.internet.email(),
          activePackage: "608e7a7ee11f711a34fb0474", // exists in db
          avatar: filePath,
        })
        .expect(201);
      created_tenants.push(res2.body.tenantId);
    }
    const res = await request(app)
      .post(full_url("fetch-tenant-details"))
      .set("Authorization", `Bearer ${token}`)
      .send({
        tenantId: created_tenants[0],
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Tenant details fetched sucessfully.",
      data: expect.any(Object),
    });
  });

  test("PATCH /add-all-count-to-tenant", async () => {
    let filePath: string = "";
    {
      const res = await request(app)
        .post(full_url("upload-avatar"))
        .set("Authorization", `Bearer ${token}`)
        .attach("avatar", "/server/assets/image.png")
        .expect(201);
      filePath = res.body.file;

      await request(app)
        .post(full_url("create"))
        .set("Authorization", `Bearer ${token}`)
        .send({
          ...fakeTenant,
          name: faker.name.fullName(),
          phoneNo: faker.phone.number("8#########"),
          email: faker.internet.email(),
          activePackage: "608e7a7ee11f711a34fb0474", // exists in db
          avatar: filePath,
        })
        .expect(201);
    }
    const res = await request(app)
      .patch(full_url("add-all-count-to-tenant"))
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Data updated Successfully!",
    });
  });

  test("POST /add-actualSize-to-tenant", async () => {
    let filePath: string = "";
    {
      const res = await request(app)
        .post(full_url("upload-avatar"))
        .set("Authorization", `Bearer ${token}`)
        .attach("avatar", "/server/assets/image.png")
        .expect(201);
      filePath = res.body.file;

      await request(app)
        .post(full_url("create"))
        .set("Authorization", `Bearer ${token}`)
        .send({
          ...fakeTenant,
          name: faker.name.fullName(),
          phoneNo: faker.phone.number("8#########"),
          email: faker.internet.email(),
          activePackage: "608e7a7ee11f711a34fb0474", // exists in db
          avatar: filePath,
        })
        .expect(201);
    }
    const res = await request(app)
      .post(full_url("add-actualSize-to-tenant"))
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Data updated Successfully!",
    });
  });

  test("GET /get-tenant-stats", async () => {
    let filePath: string = "";
    {
      const res = await request(app)
        .post(full_url("upload-avatar"))
        .set("Authorization", `Bearer ${token}`)
        .attach("avatar", "/server/assets/image.png")
        .expect(201);
      filePath = res.body.file;

      await request(app)
        .post(full_url("create"))
        .set("Authorization", `Bearer ${token}`)
        .send({
          ...fakeTenant,
          name: faker.name.fullName(),
          phoneNo: faker.phone.number("8#########"),
          email: faker.internet.email(),
          activePackage: "608e7a7ee11f711a34fb0474", // exists in db
          avatar: filePath,
        })
        .expect(201);
    }
    const res = await request(app)
      .get(full_url("get-tenant-stats"))
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      data: expect.any(Object),
      packageData: expect.any(Object),
    });
  });

  test("PATCH /updatepublicMapRef", async () => {
    let filePath: string = "";
    {
      const res = await request(app)
        .post(full_url("upload-avatar"))
        .set("Authorization", `Bearer ${token}`)
        .attach("avatar", "/server/assets/image.png")
        .expect(201);
      filePath = res.body.file;

      await request(app)
        .post(full_url("create"))
        .set("Authorization", `Bearer ${token}`)
        .send({
          ...fakeTenant,
          name: faker.name.fullName(),
          phoneNo: faker.phone.number("8#########"),
          email: faker.internet.email(),
          activePackage: "608e7a7ee11f711a34fb0474", // exists in db
          avatar: filePath,
        })
        .expect(201);
    }
    const res = await request(app)
      .patch(full_url("updatepublicMapRef"))
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "All tenant documents modified",
    });
  });

  test("DELETE /delete-tenant", async () => {
    let filePath: string = "";
    const created_tenants: string[] = [];
    {
      const res = await request(app)
        .post(full_url("upload-avatar"))
        .set("Authorization", `Bearer ${token}`)
        .attach("avatar", "/server/assets/image.png")
        .expect(201);
      filePath = res.body.file;

      const res2 = await request(app)
        .post(full_url("create"))
        .set("Authorization", `Bearer ${token}`)
        .send({
          ...fakeTenant,
          name: faker.name.fullName(),
          phoneNo: faker.phone.number("8#########"),
          email: faker.internet.email(),
          activePackage: "608e7a7ee11f711a34fb0474", // exists in db
          avatar: filePath,
        })
        .expect(201);
      created_tenants.push(res2.body.tenantId);
    }
    const res = await request(app)
      .delete(full_url("delete-tenant"))
      .set("Authorization", `Bearer ${token}`)
      .send({
        tenantId: created_tenants[0],
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Data deleted Successfully!",
      data: expect.any(Object),
    });
  });
});
