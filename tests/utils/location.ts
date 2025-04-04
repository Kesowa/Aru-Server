import { SuperAgentTest } from "supertest";
import { CurriedUrl } from "./utils";
import { faker } from "@faker-js/faker";

const full_url = CurriedUrl("location");

const coordinates = [
  [
    [88.47412616159087, 22.576572985349607],
    [88.47393132628888, 22.57600845615178],
    [88.47422357924162, 22.57593711438538],
    [88.47440161839664, 22.576476829440843],
    [88.47412616159087, 22.576572985349607],
  ],
];

export async function createLocation(agent: SuperAgentTest, type?: "Polygon" | "Point") {
  const res = await agent
        .post(full_url("create"))
        .send({
          type: type ?? "Polygon",
          coordinates: (type === "Point") ? coordinates[0][0] : coordinates,
          properties: {
            name: faker.address.streetAddress(),
          },
        })
        .expect(201);
  
  expect(res.body).toMatchObject({
    status: true,
    message: expect.any(String),
    data: expect.any(Object),
  });

  return res.body.data;
}
