import { CurriedUrl, Login } from "../config/utils";
import request from "supertest";
import app from "../src/app";
import { randomUUID } from "crypto";
import { faker } from "@faker-js/faker";

let token: string;
beforeAll(async () => (token = await Login()));
const full_url = CurriedUrl("tenant/user");

const fakeUser = {
  userGroupId: "6034c331a2f9c7554b1d42e0", // exists in db
  dob: "2021-11-01T11:48:04.345+00:00",
  aadhaarNo: Math.floor(Math.random() * 10000000000000),
  pilotLicenceNo: Math.floor(Math.random() * 1000000),
  avatar: " ",
};

describe("/user API", () => {
  test("POST /upload-profile-picture", async () => {
    const res = await request(app)
      .post(full_url("upload-profile-picture"))
      .set("Authorization", `Bearer ${token}`)
      .attach("avatar", "/server/assets/image.png")
      .expect(201);

    expect(res.body).toMatchObject({
      status: true,
      message: "file uploaded sucessfully",
      file: expect.any(String),
    });
  });

  test("POST /create-tenant-user", async () => {
    const res = await request(app)
      .post(full_url("create-tenant-user"))
      .set("Authorization", `Bearer ${token}`)
      .send({
        ...fakeUser,
        name: faker.name.fullName(),
        phoneNo: faker.phone.number("8#########"),
        email: faker.internet.email(),
      })
      .expect(201);

    expect(res.body).toMatchObject({
      status: true,
      message: "User created! Check email to change password",
      data: expect.any(Object),
    });
  });

  test("GET /fetch-all-user", async () => {
    await request(app)
      .post(full_url("create-tenant-user"))
      .set("Authorization", `Bearer ${token}`)
      .send({
        ...fakeUser,
        name: faker.name.fullName(),
        phoneNo: faker.phone.number("8#########"),
        email: faker.internet.email(),
      })
      .expect(201);
    const res = await request(app)
      .get(full_url("fetch-all-user"))
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Users fetched sucessfully.",
      data: expect.any(Array),
    });
  });

  test("GET /generate-userList-csv", async () => {
    await request(app)
      .post(full_url("create-tenant-user"))
      .set("Authorization", `Bearer ${token}`)
      .send({
        ...fakeUser,
        name: faker.name.fullName(),
        phoneNo: faker.phone.number("8#########"),
        email: faker.internet.email(),
      })
      .expect(201);
    const res = await request(app)
      .get(full_url("generate-userList-csv"))
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Users CSV generated sucessfully.",
      pathh: expect.any(String),
    });
  });

  test("PATCH /edit-user", async () => {
    const created_users: any[] = [];
    {
      const res = await request(app)
        .post(full_url("create-tenant-user"))
        .set("Authorization", `Bearer ${token}`)
        .send({
          ...fakeUser,
          name: faker.name.fullName(),
          phoneNo: faker.phone.number("8#########"),
          email: faker.internet.email(),
        })
        .expect(201);
      created_users.push(res.body.data);
    }
    const res = await request(app)
      .patch(full_url("edit-user"))
      .set("Authorization", `Bearer ${token}`)
      .send({
        id: created_users[0]._id,
        name: randomUUID(),
        phoneNo: faker.phone.number("8#########"),
        email: faker.internet.email(),
        aadhaarNo: Math.floor(Math.random() * 10000000000000),
        pilotLicenceNo: Math.floor(Math.random() * 1000000),
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "User data successfully updated!",
      data: expect.any(Object),
    });
  });

  test("PATCH /terms-conditions-check", async () => {
    await request(app)
      .post(full_url("create-tenant-user"))
      .set("Authorization", `Bearer ${token}`)
      .send({
        ...fakeUser,
        name: faker.name.fullName(),
        phoneNo: faker.phone.number("8#########"),
        email: faker.internet.email(),
      })
      .expect(201);
    const res = await request(app)
      .patch(full_url("terms-conditions-check"))
      .set("Authorization", `Bearer ${token}`)
      .query({
        terms: "true",
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Terms and Conditions accepted successfully",
      data: expect.any(Object),
    });
  });

  test("POST /terms-insert", async () => {
    await request(app)
      .post(full_url("create-tenant-user"))
      .set("Authorization", `Bearer ${token}`)
      .send({
        ...fakeUser,
        name: faker.name.fullName(),
        phoneNo: faker.phone.number("8#########"),
        email: faker.internet.email(),
      })
      .expect(201);
    const res = await request(app)
      .post(full_url("terms-insert"))
      .set("Authorization", `Bearer ${token}`)
      .query({
        flag: "go",
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Successfully data updated!",
    });
  });

  test("DELETE /delete-user", async () => {
    const created_users: any[] = [];
    {
      const res = await request(app)
        .post(full_url("create-tenant-user"))
        .set("Authorization", `Bearer ${token}`)
        .send({
          ...fakeUser,
          name: faker.name.fullName(),
          phoneNo: faker.phone.number("8#########"),
          email: faker.internet.email(),
        })
        .expect(201);
      created_users.push(res.body.data);
    }
    const res = await request(app)
      .delete(full_url("delete-user"))
      .set("Authorization", `Bearer ${token}`)
      .query({
        id: created_users[0]._id,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "User deleted successfully!",
    });
  });
});
