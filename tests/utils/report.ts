import { SuperAgentTest } from "supertest";
import { createMission } from "./mission";
import { createLayer, createRasterLayer } from "./layer";
import { createUser } from "./user";
import { CurriedUrl } from "./utils";

export async function createMissionForReport(agent: SuperAgentTest, superAdminAgent: SuperAgentTest) {
  const { mission, flight } = await createMission(agent, superAdminAgent);

  const vectorLayerData = [
    {
      vector: "Plot",
      filePath: "./assets/AA1_Plot.geojson"
    },{
      vector: "Building Footprint",
      filePath: "./assets/AA1_Building_Footprint.geojson"
    },{
      vector: "Block Boundary",
      filePath: "./assets/AA1_Block_Boundary.geojson"
    },{
      vector: "Green Verge",
      filePath: "./assets/AA1_Green_Cover.geojson"
    },{
      vector: "Jungle",
      filePath: "./assets/AA1_Tree_Count.geojson"
    },{
      vector: "Waterbody",
      filePath: "./assets/AA1_Canals.geojson"
    },{
      vector: "Garbage Collection Point",
      filePath: "./assets/AA1_GarbageCollection.geojson"
    }
  ];
  const rasterLayerData = [
    {
      raster: "ORTHO",
      filePath: "./assets/Ortho_25cm.tif",
    }
  ];
  const layers = await Promise.all([
    ...vectorLayerData.map(({vector, filePath}) => createLayer(agent, superAdminAgent, mission._id, vector, filePath)),
    ...rasterLayerData.map(({raster, filePath}) => createRasterLayer(agent, superAdminAgent, mission._id, raster, filePath)),
  ]);

  // assign pilot
  const pilot = await createUser(agent, "pilot");
  await agent
      .patch(CurriedUrl("flight")("assign-pilot"))
      .send({
        flightID: flight._id,
        pilotID: pilot._id,
      })
      .expect(200);

  // mark mission as completed
  await agent
      .patch(CurriedUrl("mission")("update-status"))
      .send({
        missionID: mission._id,
        status: "Completed",
      })
      .expect(200);

  return {mission, layers};
}