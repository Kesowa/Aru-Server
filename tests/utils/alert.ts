import { SuperAgentTest } from "supertest";
import { CurriedUrl } from "./utils";
import { uploadFile } from "./upload";
import { createMission } from "./mission";

const full_url = CurriedUrl("alert");

export async function createAlert(agent: SuperAgentTest, superAdminAgent: SuperAgentTest) {
  const { mission, flight } = await createMission(agent, superAdminAgent);
  const fileId = await uploadFile(agent, "./assets/image.png");
  const res = await agent
    .post(full_url("create"))
    .send({
      missionId: mission._id,
      flightId: flight._id,
      locationName: flight.geoLocation,
      locationId: flight.locationID,
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
    message: expect.any(String),
    data: expect.any(Object),
  });

  return res.body.data;
}
