import { SuperAgentTest } from "supertest";
import { CurriedUrl, Login, LoginSuper, Logout } from "./utils/utils";
import { createMissionForReport } from "./utils/report";
import { AssignedImage, CreatedReport } from "./utils/notification";
import { faker } from "@faker-js/faker";
import { uploadFile } from "./utils/upload";

let agent: SuperAgentTest;
let superAdminAgent: SuperAgentTest;
beforeAll(async () => {
  agent = await Login();
  superAdminAgent = await LoginSuper();
});
afterAll(async () => {
  await Logout(agent);
  await Logout(superAdminAgent);
});
const full_url = CurriedUrl("report");

describe("/report API", () => {

  test("POST /block", async () => {
    const {mission, layers} = await createMissionForReport(agent, superAdminAgent);

    // flag a block feature
    const blockLayer = layers.find(layer => layer.vector === "Block Boundary" && layer.type === "Vector");
    await agent
      .patch(CurriedUrl("layer")(`flag-feature/${blockLayer._id}`))
      .send({
        layerID: blockLayer._id,
        featureIndex: [faker.datatype.number({ min: 0, max: (blockLayer.featureCount - 1) })],
        flag: true,
      })
      .expect(200);

    const res = await agent
      .post(full_url("block"))
      .send({
        missionId: mission._id,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
    });

    // check notification
    const reportNotification = await CreatedReport(mission._id)(180_000);
    expect(reportNotification).toBeDefined();
  }, 300_000);

  test("POST /plot", async () => {
    const {mission, layers} = await createMissionForReport(agent, superAdminAgent);

    // flag a plot feature
    const plotLayer = layers.find(layer => layer.vector === "Plot" && layer.type === "Vector");

    // sample plot for which to generate report
    // could have used random index, then read geojson, and extracted respective premiseNo
    // but, a few plots give error, as they don't contain any buildings at all (which is necessary, and is not error handled properly yet) 
    const PLOT = {
      idx: 4977,
      premiseNo: "39-0277",
    };

    // flag a feature
    await agent
      .patch(CurriedUrl("layer")(`flag-feature/${plotLayer._id}`))
      .send({
        layerID: plotLayer._id,
        // featureIndex: [faker.datatype.number({ min: 0, max: (plotLayer.featureCount - 1) })],
        featureIndex: [PLOT.idx],
        flag: true,
      })
      .expect(200);

    // assign layer label
    await agent
      .patch(CurriedUrl("layer")("assignLayerLabel"))
      .send({
        layerId: plotLayer._id,
        label: "premiseNo", // all plots are expected to have, and expected to be unique for each plot
      })
      .expect(200);
    
    // upload a front view image as layer file
    const fileId = await uploadFile(agent, "./assets/layerFileImages/PlotReportDemo_FrontView.png", `${PLOT.premiseNo}.png`);
    await agent
      .patch(CurriedUrl("layer")("auto-assign-uploaded-image"))
      .query({
        mode: "LayerLabel"
      })
      .send({
        file: [fileId],
        Id: plotLayer._id,
      })
      .expect(201);

    // check notification
    const imageAssignmentNotification = await AssignedImage(mission._id)(30_000);
    expect(imageAssignmentNotification).toBeDefined();

    const res = await agent
      .post(full_url("plot"))
      .send({
        missionId: mission._id,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
    });

    // check notification
    const reportNotification = await CreatedReport(mission._id)(180_000);
    expect(reportNotification).toBeDefined();
  }, 300_000);

});