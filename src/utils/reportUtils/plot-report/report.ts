import { Document } from "docx";
import { page1 } from "./reportpage1";
import { page2 } from "./reportpage2";
import { page3 } from "./reportpage3";
import { numberings } from "./../reportUtils";
import { IPlotReportData } from "./types";
import fs from "fs";
import path from "path";

const fallBackImageBuffer = fs.readFileSync(path.join(__dirname, "..", "assets", "fallback.png"));

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
      page1({
        date,
        users,
        blockName,
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

        buildingArea,
        buildingFootprint,
        buildingAvailable,
        floorCount,
        buildingNo,
        hasCompletionCertificate,
        buildingHeight,

        greeneryPercent,
        canopyPercent,
        waterbodyPercent,
        garbageCollectionInfo,
        averageBuildingHeight,
        averageBlockHeight,
        averageIncentives,
      }),
    ],
  });
};
