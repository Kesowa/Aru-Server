import { SuperAgentTest } from "supertest";
import { CurriedUrl } from "./utils";
import { uploadFile } from "./upload";

const full_url = CurriedUrl("alert");

export async function createAlert(agent: SuperAgentTest) {
  const fileId = await uploadFile(agent, "./assets/image.png");
  const res = await agent
    .post(full_url("create"))
    .send({
      missionId: "6267dd4b2a2d394080a20848",
      flightId: "6267dd4b2a2d394080a20849",
      locationName: "Address of location from image telemetry data",
      locationId: "6123317cdaacac04cdb2d805",
      location: {
        lat: 22,
        long: 23,
      },
      note: "Type can be either Manual or Automated",
      onSite: false,
      image: fileId,
      pcount: 5,
      type: "Manual",
    })
    .expect(201);

  expect(res.body).toMatchObject({
    status: true,
    message: "New alert created",
    data: expect.any(Object),
  });

  return res.body.data;
}
