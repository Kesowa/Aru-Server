import { CurriedUrl, Login, Logout } from "./utils/utils";
import {SuperAgentTest} from "supertest";

let agent: SuperAgentTest;

beforeAll(async () => (agent = await Login()));
afterAll(async () => await Logout(agent));
const full_url = CurriedUrl("streamtoken");

describe("/streamtoken API", () => {
  const eMissionID: string = "61f3b1e65f915a05cb8885ec"; // exists in db
  const eFlightID: string = "6267dd4b2a2d394080a20849"; // exists in db
  const eAssetID: string = "6082aeae98667d019a4d62af"; // doesn't yet exist in db, but works
  const eTenantID: string = "5f204f03b9445726102781a8"; // exists in db

  test("POST /gen-stream-token", async () => {
    const res = await agent
      .post(full_url("gen-stream-token"))
      .send({
        missionID: eMissionID,
        flightID: eFlightID,
        assetID: eAssetID,
        tenantID: eTenantID,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: 200,
      message: "Sucessfully generated a token",
      flightID: eFlightID,
      missionID: eMissionID,
      token: expect.any(String),
    });
  });

  test("POST /validate-token", async () => {
    const created_tokens: string[] = [];
    {
      const res = await agent
        .post(full_url("gen-stream-token"))
        .send({
          missionID: eMissionID,
          flightID: eFlightID,
          assetID: eAssetID,
          tenantID: eTenantID,
        })
        .expect(200);
      created_tokens.push(res.body.token);
    }
    await agent
      .post(full_url("validate-token"))
      .send({
        name: created_tokens[0],
      })
      .expect(200); // just status no response body for this endpoint
  });

  test("GET /get-active-streams", async () => {
    await agent
      .post(full_url("gen-stream-token"))
      .send({
        missionID: eMissionID,
        flightID: eFlightID,
        assetID: eAssetID,
        tenantID: eTenantID,
      })
      .expect(200);
    const res = await agent
      .get(full_url("get-active-streams"))
      .expect(200);

    expect(res.body).toBeInstanceOf(Array);
  });

  test("GET /get-active-stream/flight", async () => {
    const created_streams: any[] = [];
    {
      const res = await agent
        .post(full_url("gen-stream-token"))
        .send({
          missionID: eMissionID,
          flightID: eFlightID,
          assetID: eAssetID,
          tenantID: eTenantID,
        })
        .expect(200);
      created_streams.push(res.body);
    }
    const res = await agent
      .get(full_url("get-active-stream/flight"))
      .query({
        flightID: created_streams[0].flightID,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      activeStream: expect.any(Object),
    });
  });

  test("POST /remove-token", async () => {
    const created_tokens: string[] = [];
    {
      const res = await agent
        .post(full_url("gen-stream-token"))
        .send({
          missionID: eMissionID,
          flightID: eFlightID,
          assetID: eAssetID,
          tenantID: eTenantID,
        })
        .expect(200);
      created_tokens.push(res.body.token);
    }
    const res = await agent
      .post(full_url("remove-token"))
      .send({
        name: created_tokens[0],
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: "Successfully removed token",
      data: expect.any(Object),
    });
  });
});
