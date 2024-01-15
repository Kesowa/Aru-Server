import { Document } from "docx";
import { page1 } from "./reportpage1";
import { page2 } from "./reportpage2";
import { page3 } from "./reportpage3";
import { numberings } from "./../reportUtils";
import { IPlotReportData } from "./types";
import fs from "fs";
import path from "path";

const fallBackImageBuffer = fs.readFileSync(path.join(__dirname, "..", "assets", "fallback.png"));
const fallbackText = "No Available Record";

function handleDataAbsence(data: string) {
  return data ? data : fallbackText;
} 

export const generatePlotReportDocument = (data: IPlotReportData) => {
  const {
    // page 1
    blockName,
    date,
    users,
    coverImageBuffer,

    // page 2
    blockImageBuffer,
    plotImageBuffer,
    frontViewImageBuffer,

    // page 3

    // plot details
    plotArea,
    plotNo,
    premiseNo,
    pincode,
    category,
    infraction,
    isGreenTopEligible,
    isSolarPlantEligible,
    hasTradeLicense,
    tax,

    // building details
    buildingArea,
    buildingFootprint,
    buildingAvailable,
    floorCount,
    buildingNo,
    hasCompletionCertificate,
    buildingHeight,

    // block details
    greeneryPercent,
    canopyPercent,
    waterbodyPercent,
    garbageCollectionInfo,
    averageBuildingHeight,
    averageBlockHeight,
    averageIncentives,
  } = data;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
  return new Document({
    numbering: numberings,
    background: {
      color: "D9D9D9",
    },
    sections: [
      // calculated properties are calculated from geojson data. So, they will never be absent. In case of errors while calculation, the errors
      // will be thrown appropriately
      // provided properties are present on geojson data. They may be null or absent for particular plots, because maybe the info couldn't be
      // gathered during the mission, so there are indeed no records available for it. Such cases don't throw errors, and need to be handled
      // seperately.

      page1({
        date, // calculated
        users, // calculated
        blockName: handleDataAbsence(blockName), // provided
        coverImageBuffer: coverImageBuffer ? coverImageBuffer : fallBackImageBuffer,
      }),

      page2({
        imageHeading: "Block Image",
        imageBuffer: blockImageBuffer ? blockImageBuffer : fallBackImageBuffer,
      }),
      page2({
        imageHeading: "Plot Image",
        imageBuffer: plotImageBuffer ? plotImageBuffer : fallBackImageBuffer,
      }),
      page2({
        imageHeading: "Front View Image",
        imageBuffer: frontViewImageBuffer ? frontViewImageBuffer : fallBackImageBuffer,
      }),

      page3({
        plotArea, // calculated
        plotNo: handleDataAbsence(plotNo), // provided
        premiseNo: handleDataAbsence(premiseNo), // provided
        pincode: handleDataAbsence(pincode), // provided
        category: handleDataAbsence(category), // provided
        infraction: handleDataAbsence(infraction), // provided
        isGreenTopEligible: handleDataAbsence(isGreenTopEligible), // provided
        isSolarPlantEligible: handleDataAbsence(isSolarPlantEligible), // provided
        hasTradeLicense: handleDataAbsence(hasTradeLicense), // provided
        tax: handleDataAbsence(tax), // provided

        buildingArea, // calculated
        buildingFootprint, // calculated
        buildingAvailable: handleDataAbsence(buildingAvailable), // provided
        floorCount: handleDataAbsence(floorCount), // provided
        buildingNo: handleDataAbsence(buildingNo), // provided
        hasCompletionCertificate: handleDataAbsence(hasCompletionCertificate), // provided
        buildingHeight: handleDataAbsence(buildingHeight), // provided

        greeneryPercent, // calculated
        canopyPercent, // calculated
        waterbodyPercent, // calculated
        blockName: handleDataAbsence(blockName), // provided
        garbageCollectionInfo: handleDataAbsence(garbageCollectionInfo), // provided
        averageBuildingHeight: handleDataAbsence(averageBuildingHeight), // provided
        averageBlockHeight: handleDataAbsence(averageBlockHeight), // provided
        averageIncentives: handleDataAbsence(averageIncentives), // provided
      }),
    ],
  });
};
