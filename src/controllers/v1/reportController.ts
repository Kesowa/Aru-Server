import { promises as fs } from "fs";
import * as turf from "@turf/turf";
import { Request } from "express";
import Mission from "../../models/mission";
import { AuthResponse } from "../../utils/interfaceUtils";
import Layer from "../../models/layer";
import { IVector } from "../../schemas/vectorprops";
import { DirPath, Directory, PUBLIC_SERVER } from "../../constants";
import { generateDocument } from "../../utils/reportUtils/report";
import { Packer } from "docx";
import { IData } from "../../utils/reportUtils/types";
import Flight from "../../models/flight";
import { IUser } from "../../schemas/user";
import {
  privateCommercialLayerTypes,
  residentialLayerTypes,
  govtCommercialLayerTypes,
  housingComplexLayerTypes,
  govtLayerTypes,
  motorableRoadsLayerTypes,
  footpathLayerTypes,
  cycleTrackLayerTypes,
  greeneryLayerTypes,
  waterBodyLayerTypes,
  vacantTypes,
  underConstructionTypes,
  deliverableTypes,
} from "../../utils/reportUtils/reportUtils";
import Document from "../../models/document";
import { missionSpecificSocket } from "../../socket";
import { ScreenshotGenerator } from "../../utils/reportUtils/screenshot";
import { pino } from "pino";

export async function findArea(gjson: any) {
  try {
    let totalArea = 0;
    const allIndependantPositions: any[] = [];
    for (const feature of gjson.features) {
      if (
        ["MultiPolygon", "Polygon", "MultiLineString"].includes(
          feature.geometry.type
        )
      ) {
        if (feature.geometry.type === "MultiLineString") {
          for (const linestring of feature.geometry.coordinates) {
            allIndependantPositions.concat(linestring);
          }
          continue;
        }
        let polygons = feature.geometry.coordinates;
        if (feature.geometry.type === "Polygon") {
          polygons = [polygons];
        }
        for (const polygon of polygons) {
          const area = turf.area(turf.polygon(polygon));
          totalArea += area;
        }
      }
    }
    if (allIndependantPositions.length >= 3) {
      const area = turf.area(turf.polygon([allIndependantPositions]));
      totalArea += area;
    }
    return totalArea;
  } catch (error) {
    console.error(error);
    return 0;
  }
}

export async function findLength(gjson: any) {
  try {
    let totalLength = 0;
    for (const feature of gjson.features) {
      if (
        ["MultiLineString", "LineString", "Polygon"].includes(
          feature.geometry.type
        )
      ) {
        let lines = feature.geometry.coordinates;
        if (feature.geometry.type === "LineString") {
          lines = [lines];
        }
        // Polygon and MultiLineString both have similar structure, array of line strings
        totalLength += turf.length(turf.multiLineString(lines));
      }
    }
    return totalLength / 1000; // as turf calculates in km, but we need in m
  } catch (error) {
    console.error(error);
    return 0;
  }
}

export async function countPolygons(gjson: any) {
  try {
    let count = 0;
    for (const feature of gjson.features) {
      if (feature.geometry.type === "Polygon") {
        count++;
      } else if (feature.geometry.type === "MultiPolygon") {
        count += feature.geometry.coordinates.length;
      }
    }
    return count;
  } catch (error) {
    console.error(error);
    return 0;
  }
}

export const generateReport = async (req: Request, res: AuthResponse) => {
  {
    const { missionId } = req.body;
    try {
      // initializing all numbers and texts
      const data: IData = {
        missionHeading: "",
        missionSubHeading: "",
        missionMapImgPath: "",
        missionCode: "",
        date: "",
        users: [],
        emails: [],
        phoneNos: [],
        area: {
          total: 0,
          privateSpaces: [
            { name: "Private Commercial", value: 0 },
            { name: "Residential", value: 0 },
            { name: "Govt. Commercial", value: 0 },
            { name: "Housing Complex", value: 0 },
          ],
          publicSpaces: [
            { name: "Government", value: 0 },
            { name: "Motorable Roads", value: 0 },
            { name: "Footpath", value: 0 },
            { name: "Cycle Track", value: 0 },
            { name: "Parks & Green", value: 0 },
            { name: "Waterbody", value: 0 },
          ],
          other: 0,
        },
        occupancy: [
          {
            name: "Private Commercial",
            occupied: 0,
            underConstruction: 0,
            vacant: 0,
          },
          { name: "Residential", occupied: 0, underConstruction: 0, vacant: 0 },
          {
            name: "Govt. Commercial",
            occupied: 0,
            underConstruction: 0,
            vacant: 0,
          },
          {
            name: "Housing Complex",
            occupied: 0,
            underConstruction: 0,
            vacant: 0,
          },
          { name: "Government", occupied: 0, underConstruction: 0, vacant: 0 },
        ],
        roadCount: 0,
        roadLength: 0,
        cycleTrackLength: 0,
        deliverables: {
          OVERVIEW: [],
        },
      };

      // mission details filling
      const mission = await Mission.findOne(
        { _id: missionId },
        { name: 1, user: 1 }
      ).populate<{ user: IUser }>({
        path: "user",
        select: {
          name: 1,
          phoneNo: 1,
          email: 1,
        },
      });
      data.missionHeading = mission.name;
      // TODO: missionCode(??), missionMapImgPath(scrape screenshot)

      // date
      const now = new Date();
      const yyyy = now.getFullYear().toString();
      let mm = (now.getMonth() + 1).toString();
      let dd = now.getDate().toString();
      if (parseInt(dd) < 10) dd = "0" + dd;
      if (parseInt(mm) < 10) mm = "0" + mm;
      data.date = dd + "/" + mm + "/" + yyyy;

      // pilot details (names, phone numbers, emails)
      const flight = await Flight.findOne(
        { mission: missionId },
        { pilotID: 1 }
      ).populate<{ pilotID: IUser }>({
        path: "pilotID",
        select: {
          name: 1,
          phoneNo: 1,
          email: 1,
        },
      });
      data.users.push(mission.user.name);
      data.users.push(flight.pilotID.name);
      data.emails.push(mission.user.email);
      data.emails.push(flight.pilotID.email);
      data.phoneNos.push(mission.user.phoneNo);
      data.phoneNos.push(flight.pilotID.phoneNo);

      // area details filling (for page 2 tables)
      const vectorLayers = await Layer.find({
        missionId: missionId,
        type: "Vector",
      }).populate<{ vector: IVector }>("vector");

      function assignOccupancy(layerType: string, idx: number) {
        if (vacantTypes.includes(layerType)) {
          data.occupancy[idx].vacant++;
        } else if (underConstructionTypes.includes(layerType)) {
          data.occupancy[idx].underConstruction++;
        } else {
          data.occupancy[idx].occupied++;
        }
      }

      for (const layer of vectorLayers) {
        const layerData = await fs.readFile(
          DirPath(Directory.DEFAULT, layer.layerpath),
          "utf-8"
        );
        const gjson = JSON.parse(layerData);
        const currLayerArea = await findArea(gjson);
        const currLayerLength = await findLength(gjson);
        data.area.total += currLayerArea;
        // check the layer type and accordingly add area to respective type
        if (privateCommercialLayerTypes.includes(layer.vector.name)) {
          data.area.privateSpaces[0].value += currLayerArea;
          assignOccupancy(layer.vector.name, 0);
        } else if (residentialLayerTypes.includes(layer.vector.name)) {
          data.area.privateSpaces[1].value += currLayerArea;
          assignOccupancy(layer.vector.name, 1);
        } else if (govtCommercialLayerTypes.includes(layer.vector.name)) {
          data.area.privateSpaces[2].value += currLayerArea;
          assignOccupancy(layer.vector.name, 2);
        } else if (housingComplexLayerTypes.includes(layer.vector.name)) {
          data.area.privateSpaces[3].value += currLayerArea;
          assignOccupancy(layer.vector.name, 3);
        } else if (govtLayerTypes.includes(layer.vector.name)) {
          data.area.publicSpaces[0].value += currLayerArea;
          assignOccupancy(layer.vector.name, 4);
        } else if (motorableRoadsLayerTypes.includes(layer.vector.name)) {
          data.area.publicSpaces[1].value += currLayerArea;
          data.roadCount++;
          data.roadLength += currLayerLength;
        } else if (footpathLayerTypes.includes(layer.vector.name)) {
          data.area.publicSpaces[2].value += currLayerArea;
        } else if (cycleTrackLayerTypes.includes(layer.vector.name)) {
          data.area.publicSpaces[3].value += currLayerArea;
          data.cycleTrackLength += currLayerLength;
        } else if (greeneryLayerTypes.includes(layer.vector.name)) {
          data.area.publicSpaces[4].value += currLayerArea;
        } else if (waterBodyLayerTypes.includes(layer.vector.name)) {
          data.area.publicSpaces[5].value += currLayerArea;
        } else {
          data.area.other += currLayerArea;
        }

        // categorizing the geojson for map
        for (const d in deliverableTypes) {
          if (deliverableTypes[d].includes(layer.vector.name)) {
            if (!data.deliverables[d]) {
              data.deliverables[d] = [PUBLIC_SERVER + layer.layerpath];
            } else {
              data.deliverables[d].push(PUBLIC_SERVER + layer.layerpath);
            }
          }
        }
      }

      // all information received without errors, now can start report generation successfully
      res.status(200).json({
        status: true,
        message: "Report generation started!",
      });

      req.log.info("Generating report...");

      // saving the document
      const doc = await generateDocument(data, req.log);
      const buffer = await Packer.toBuffer(doc);
      const filename = `${missionId}-report.docx`;
      const filepath = DirPath(Directory.DOCUMENTS, filename);
      await fs.writeFile(filepath, buffer);

      const fileStats = await fs.stat(filepath);

      await Document.findOneAndDelete({ name: filename });

      const docDB = new Document({
        name: filename,
        modDate: new Date(),
        fileSize: (Number(fileStats.size) / (1024 * 1024)).toFixed(5),
        fileType: "docx",
        folderName: "root1234",
        filePath: `/documents/${filename}`,
        missionId,
        tenantId: res.locals.user.tenantId,
        createdBy: res.locals.user._id,
        updatedBy: res.locals.user._id,
      });
      const savedDoc = await docDB.save();

      req.log.info("Report Generation Complete");

      missionSpecificSocket
        .to(missionId.toString())
        .emit("REPORT_GENERATION_COMPLETE", savedDoc);
    } catch (error) {
      req.log.error(error);
      res.status(500).json({
        status: false,
        message: "Server Error",
      });
      missionSpecificSocket
        .to(missionId.toString())
        .emit("REPORT_GENERATION_FAILED", error);
    }
  }
};

export async function saveScreenshot(layerIds: string[], logger: pino.Logger) {
  const vectorFilePaths: string[] = [];
  const rasterFilePaths: string[] = [];

  for(const id of layerIds) {
    const layer = await Layer.findById(id);
    if(layer.type === "Vector") vectorFilePaths.push(PUBLIC_SERVER + layer.layerpath);
    else rasterFilePaths.push(PUBLIC_SERVER + layer.layerpath);
  }

  const ssGenerator = new ScreenshotGenerator(logger);
  await ssGenerator.init();

  logger.info("Browser Launched for screenshots...");

  const ssBuffer = await ssGenerator.getMapSS(
    "https://cog-nk.kesowa.com",
    vectorFilePaths,
    rasterFilePaths
  );

  logger.info("Image Captured...");

  return ssBuffer;
}

export interface IPlotReportData {
  // generated
  coverImage?: Buffer,
  blockImage?: Buffer,
  plotImage?: Buffer,
  
  // generated => generated from geojson by code
  // provided => needs to be provided as a geojson feature
  
  // plot details
  plotArea: number, // generated
  plotNo: string, // provided
  premiseNo: string, // provided
  pincode: number, // provided
  category: string, // provided
  infraction: string, // provided
  isIncentiveEligible: boolean, // provided
  hasTradeLicense: boolean, // provided
  tax: number, // provided
  
  // building details
  buildingArea: number, // generated
  buildingFootprint: number, // generated, (building area / plot area) * 100% ??
  buildingAvailable: boolean, // provided
  floorCount: string, // provided
  buildingNo: string, // provided
  hasCompletionCertificate: boolean, // provided
  buildingHeight: number, // provided

  // block details
  blockArea: number, // generated
  greeneryArea: number, // generated
  canopyArea: number, // generated
  waterbodyArea: number, // generated
  greeneryPercent: number, // generated
  canopyPercent: number, // generated
  waterbodyPercent: number, // generated
  garbageCollectionInfo: string, // provided
  averageBuildingHeight: number, // provided
  averageBlockHeight: number, // provided
  averageIncentives: number, // provided

}

export const generatePlotReport = async (req: Request<{},{},{ 
  coverPageLayers: string[],
  blockImageLayers: string[],
  plotImageLayers: string[],
  plotLayerId: string,
  buildingLayerId: string,
  blockLayerId: string,
  greeneryLayerId: string,
  canopyLayerId: string,
  waterbodyLayerId: string,
}>, res: AuthResponse) => {
  {

    try {
      const { 
        coverPageLayers, 
        blockImageLayers, 
        plotImageLayers, 
        plotLayerId, 
        buildingLayerId, 
        blockLayerId, 
        greeneryLayerId,
        canopyLayerId,
        waterbodyLayerId
      } = req.body;

      // ===== Images =====
      // const coverImgBuff = await saveScreenshot(coverPageLayers, req.log);
      // const blockImgBuff = await saveScreenshot(blockImageLayers, req.log);
      // const plotImgBuff = await saveScreenshot(plotImageLayers, req.log);

      // ===== Plot Details =====
      const plotLayer = await Layer.findById(plotLayerId);
      const plotGeojson = await JSON.parse(await fs.readFile(
        DirPath(Directory.DEFAULT, plotLayer.layerpath),
        "utf-8"
      ));
      // provided details
      let allPlotFeatureData: any;
      for(const feature of plotGeojson.features) {
        allPlotFeatureData = { ...allPlotFeatureData, ...feature.properties };
      }
      // calculated details
      const plotArea = await findArea(plotGeojson);

      // ===== Building Details =====
      const buildingLayer = await Layer.findById(buildingLayerId);
      const buildingGeojson = await JSON.parse(await fs.readFile(
        DirPath(Directory.DEFAULT, buildingLayer.layerpath),
        "utf-8"
      ));
      // provided details
      let allBuildingFeatureData: any;
      for(const feature of buildingGeojson.features) {
        allBuildingFeatureData = { ...allBuildingFeatureData, ...feature.properties };
      }
      // calculated details
      const buildingArea = await findArea(buildingGeojson);

      // ===== Block Details =====
      const blockLayer = await Layer.findById(blockLayerId);
      const blockGeojson = await JSON.parse(await fs.readFile(
        DirPath(Directory.DEFAULT, blockLayer.layerpath),
        "utf-8"
      ));
      // calculated details
      const blockArea = await findArea(blockGeojson);
      // provided details
      let allBlockFeatureData: any;
      for(const feature of blockGeojson.features) {
        allBlockFeatureData = { ...allBlockFeatureData, ...feature.properties };
      }

      const greeneryLayer = await Layer.findById(greeneryLayerId);
      const greeneryGeojson = await JSON.parse(await fs.readFile(
        DirPath(Directory.DEFAULT, greeneryLayer.layerpath),
        "utf-8"
      ));
      const greeneryArea = await findArea(greeneryGeojson);

      const canopyLayer = await Layer.findById(canopyLayerId);
      const canopyGeojson = await JSON.parse(await fs.readFile(
        DirPath(Directory.DEFAULT, canopyLayer.layerpath),
        "utf-8"
      ));
      const canopyArea = await findArea(canopyGeojson);

      const waterbodyLayer = await Layer.findById(waterbodyLayerId);
      const waterbodyGeojson = await JSON.parse(await fs.readFile(
        DirPath(Directory.DEFAULT, waterbodyLayer.layerpath),
        "utf-8"
      ));
      const waterbodyArea = await findArea(waterbodyGeojson);

      // ===== Putting the data together =====
      const data: IPlotReportData = {
        // images
        // coverImage: coverImgBuff,
        // blockImage: blockImgBuff,
        // plotImage: plotImgBuff,
        
        // need to be provided in geojson features

        // plot details
        plotArea,
        plotNo: String(allPlotFeatureData.plotNo),
        premiseNo: String(allPlotFeatureData.premiseNo),
        pincode: Number(allPlotFeatureData.pincode),
        category: String(allPlotFeatureData.category),
        infraction: String(allPlotFeatureData.infraction),
        isIncentiveEligible: (allPlotFeatureData.isIncentiveEligible === "Yes") ? true : false,
        hasTradeLicense: (allPlotFeatureData.hasTradeLicense === "Yes") ? true : false,
        tax: Number(allPlotFeatureData.tax),

        // building details
        buildingArea,
        buildingFootprint: (buildingArea / plotArea) * 100,
        buildingAvailable: (allBuildingFeatureData.buildingAvailable === "Yes") ? true : false,
        floorCount: String(allBuildingFeatureData.floorCount),
        buildingNo: String(allBuildingFeatureData.buildingNo),
        hasCompletionCertificate: (allBuildingFeatureData.hasCompletionCertificate === "Yes") ? true : false,
        buildingHeight: Number(allBuildingFeatureData.buildingHeight),

        // block details
        blockArea,
        greeneryArea,
        canopyArea,
        waterbodyArea,
        greeneryPercent: (greeneryArea/blockArea)*100,
        canopyPercent: (canopyArea/blockArea)*100,
        waterbodyPercent: (waterbodyArea/blockArea)*100,
        garbageCollectionInfo: String(allBlockFeatureData.garbageCollectionInfo),
        averageBuildingHeight: Number(allBlockFeatureData.averageBuildingHeight),
        averageBlockHeight: Number(allBlockFeatureData.averageBlockHeight),
        averageIncentives: Number(allBlockFeatureData.averageIncentives),
      };

      req.log.info(data);

      res.status(200).json({
        status: true,
        message: "Successfully generated data",
      });

    } catch (error) {
      req.log.error(error);
      res.status(500).json({
        status: false,
        message: "Server Error",
      });
    }
  }
}