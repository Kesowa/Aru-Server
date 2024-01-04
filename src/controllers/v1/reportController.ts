import { promises as fs } from "fs";
import * as turf from "@turf/turf";
import { Request } from "express";
import Mission from "../../models/mission";
import { AuthResponse } from "../../utils/interfaceUtils";
import Layer from "../../models/layer";
import { IVector, VectorName } from "../../schemas/vectorprops";
import { DirPath, Directory, PUBLIC_SERVER, TITILER_SERVER, TITILER_STATIC } from "../../constants";
import { generateDocument } from "../../utils/reportUtils/block-report/report";
import { Packer } from "docx";
import { IData } from "../../utils/reportUtils/block-report/types";
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
import { IPlotReportData } from "../../utils/reportUtils/plot-report/types";
import { generatePlotReportDocument } from "../../utils/reportUtils/plot-report/report";
import vector from "../../models/vectorprops";
import raster from "../../models/rasterprops";
import { readGeoJson } from "../../utils/geojsonUtils";
import layerFiles from "../../models/layerFiles";

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
              data.deliverables[d] = [TITILER_STATIC + layer.layerpath];
            } else {
              data.deliverables[d].push(TITILER_STATIC + layer.layerpath);
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

export async function saveScreenshot(vectorFeatures: any[], rasterFilePaths: string[], logger: pino.Logger) {
  const ssGenerator = new ScreenshotGenerator(logger);
  await ssGenerator.init();

  logger.info("Browser Launched for screenshots...");

  const ssBuffer = await ssGenerator.getMapSS(
    TITILER_SERVER,
    vectorFeatures,
    rasterFilePaths
  );

  await ssGenerator.destroy();

  logger.info("Image Captured...");

  return ssBuffer;
}

export const generatePlotReport = async (req: Request<{}, {}, {
  missionId: string,
}>, res: AuthResponse) => {
  {
    const { missionId } = req.body;
    try {

      const [blockBoundaryType, plotType, buildingFootprintType, waterbodyType, orthoType, treeCoverType, greeneryType] = await Promise.all([
        vector.findOne({ name: VectorName.Block_Boundary }),
        vector.findOne({ name: VectorName.Plot }),
        vector.findOne({ name: VectorName.Building_Footprint }), // there's a type with name "Building footprint" as well, be warned
        vector.findOne({ name: VectorName.Water_Body }), // there's a type with name "Water Body" as well, be warned
        raster.findOne({ name: "ORTHO" }),
        vector.findOne({ name: VectorName.Jungle }),
        vector.findOne({ name: VectorName.Green_Verge }),
      ]);
      const [blockBoundaryLayer, plotLayer, buildingFootprintLayer, waterbodyLayer, rasterLayer, treeCoverLayer, greeneryLayer] = await Promise.all([
        Layer.findOne({
          tenantId: res.locals.user.tenantId._id,
          missionId: req.body.missionId,
          vector: blockBoundaryType._id,
        }), Layer.findOne({
          tenantId: res.locals.user.tenantId._id,
          missionId: req.body.missionId,
          vector: plotType._id,
        }), Layer.findOne({
          tenantId: res.locals.user.tenantId._id,
          missionId: req.body.missionId,
          vector: buildingFootprintType._id,
        }), Layer.findOne({
        }), Layer.findOne({
          tenantId: res.locals.user.tenantId._id,
          missionId: req.body.missionId,
          vector: waterbodyType._id,
        }), Layer.findOne({
          tenantId: res.locals.user.tenantId._id,
          missionId: req.body.missionId,
          raster: orthoType._id,
        }),Layer.findOne({
          tenantId: res.locals.user.tenantId._id,
          missionId: req.body.missionId,
          raster: treeCoverType._id,
        }),Layer.findOne({
          tenantId: res.locals.user.tenantId._id,
          missionId: req.body.missionId,
          raster: greeneryType._id,
        })
      ]);
      const rasterFilePath = TITILER_STATIC + rasterLayer.layerpath;
      const plotGeojson = await readGeoJson(DirPath(Directory.DEFAULT, plotLayer.layerpath));
      const blockGeojson = await readGeoJson(DirPath(Directory.DEFAULT, blockBoundaryLayer.layerpath));

      // multiple plot reports will be generated, one for each flagged plot
      // use Plot_no to join building_footprint with each plot. A single plot can have multiple building, and hence multiple building footprints, on top of it.
      const flaggedPlotGeojson = plotGeojson.features.filter((_, index) => plotLayer.flaggedFeatures.includes(index));

      // plot images (one per plot, fail safe if absent)
      const flaggedPlotFile = await layerFiles.find({
        tenantId: res.locals.user.tenantId._id,
        layerId: plotLayer._id,
        sys_Id: { $in: flaggedPlotGeojson.map(plot => plot.properties.sys_id) }
      });
      
      // date
      const now = new Date();
      const date = now.toLocaleDateString("in");

      // TODO => Which users to include in the plot reports ? Will it be users who participated in overall mission or different
      //         users who worked on different plot layers seperately ?
      const userList = []; // TODO

      // =================================== DETAILS THAT WON'T VARY ACROSS REPORTS OF DIFFERENT PLOTS ==================================

      // ************* COVER PAGE DETAILS ****************
      // Cover page in sample report shows block boundary and all the plots in the block, so it will be same for all plot reports
      const coverPageVectorFeatures = [...blockGeojson.features, ...flaggedPlotGeojson];
      const coverImageBuffer = await saveScreenshot(coverPageVectorFeatures, [rasterFilePath], req.log);
      // await fs.writeFile(DirPath(Directory.DOCUMENTS, "coverImage.png"), coverImageBuffer); // For Debugging

      // ************* BLOCK DETAILS ******************
      // All plots belong to same block, so block properties need not be calculated repeatedly
      
      const blockArea = await findArea(blockGeojson);

      // provided details
      let allBlockFeatureData: any;
      for(const feature of blockGeojson.features) {
        allBlockFeatureData = { ...allBlockFeatureData, ...feature.properties };
      }

      const waterbodyGeojson = await readGeoJson(DirPath(Directory.DEFAULT, waterbodyLayer.layerpath));
      const waterbodyArea = await findArea(waterbodyGeojson);

      // TODO => Which layers to consider for greenery ?
      // const greeneryGeojson = await readGeoJson(DirPath(Directory.DEFAULT, greeneryLayer.layerpath));
      // const greeneryArea = await findArea(greeneryGeojson);

      // TODO => Which layers to consider for canopy ?
      // const canopyGeojson = await readGeoJson(DirPath(Directory.DEFAULT, canopyLayer.layerpath));
      // const canopyArea = await findArea(canopyGeojson);

      // ==================================================================================================================================

      // ===================================== DETAILS THAT VARY ACROSS REPORTS OF DIFFERENT PLOTS ========================================

      for(const plotFeature of flaggedPlotGeojson) {

        const plotAttributes = plotFeature.properties;
        
        // ******************** PLOT DETAILS ***********************
    
        // const plotLayer = await Layer.findById(plotLayerId).populate<{ createdBy: IUser }>("createdBy").populate<{ updatedBy: IUser }>("updatedBy");
        // userList.add(plotLayer.createdBy.name);
        // userList.add(plotLayer.updatedBy.name);
        // const plotGeojson = await JSON.parse(await fs.readFile(
        //   DirPath(Directory.DEFAULT, plotLayer.layerpath),
        //   "utf-8"
        // ));
    
        // // provided details
        // let allPlotFeatureData: any;
        // for (const feature of plotGeojson.features) {
        //   allPlotFeatureData = { ...allPlotFeatureData, ...feature.properties };
        // }

        // // front view image
        // const plotLayerFile = await layerFiles.findOne({ layerId: plotLayerId });
        // const frontViewImageBuffer = await fs.readFile(DirPath(Directory.DEFAULT, plotLayerFile.filePath));
    
        // ******************** BUILDING DETAILS ************************
    
        // const buildingLayer = await Layer.findById(buildingLayerId).populate<{ createdBy: IUser }>("createdBy").populate<{ updatedBy: IUser }>("updatedBy");
        // userList.push(buildingLayer.createdBy.name);
        // userList.push(buildingLayer.updatedBy.name);
        // const buildingGeojson = await JSON.parse(await fs.readFile(
        //   DirPath(Directory.DEFAULT, buildingLayer.layerpath),
        //   "utf-8"
        // ));
    
        // // provided details
        // let allBuildingFeatureData: any;
        // for(const feature of buildingGeojson.features) {
        //   allBuildingFeatureData = { ...allBuildingFeatureData, ...feature.properties };
        // }
    
        // // calculated details
        // const buildingArea = await findArea(buildingGeojson);
    
        // ================= PUTTING TOGETHER THE DATA =======================
    
        const data: IPlotReportData = {
            // cover page details
    
            date,
            users,
            coverImageBuffer,
    
            // plot details
    
            frontViewImageBuffer,
            plotImageBuffer,
            plotArea,
            plotNo: String(allPlotFeatureData.plotNo),
            premiseNo: String(allPlotFeatureData.premiseNo),
            pincode: Number(allPlotFeatureData.pincode),
            category: String(allPlotFeatureData.category),
            infraction: String(allPlotFeatureData.infraction),
            isGreenTopEligible: (allPlotFeatureData.isGreenTopEligible === "Yes") ? true : false,
            isSolarPlantEligible: (allPlotFeatureData.isSolarPlantEligible === "Yes") ? true : false,
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
    
            blockImageBuffer,
            blockArea,
            greeneryArea,
            canopyArea,
            waterbodyArea,
            greeneryPercent: (greeneryArea/blockArea)*100,
            canopyPercent: (canopyArea/blockArea)*100,
            waterbodyPercent: (waterbodyArea/blockArea)*100,
            blockName: String(allBlockFeatureData.blockName),
            garbageCollectionInfo: String(allBlockFeatureData.garbageCollectionInfo),
            averageBuildingHeight: Number(allBlockFeatureData.averageBuildingHeight),
            averageBlockHeight: Number(allBlockFeatureData.averageBlockHeight),
            averageIncentives: Number(allBlockFeatureData.averageIncentives),
        };
    
        // req.log.info(data);
    
        // saving the document
        const doc = generatePlotReportDocument(data);
        const buffer = await Packer.toBuffer(doc);
        const filename = `${missionId.toString()}-plot-report.docx`;
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
          missionId: missionId,
          tenantId: res.locals.user.tenantId,
          createdBy: res.locals.user._id,
          updatedBy: res.locals.user._id,
        });
        const savedDoc = await docDB.save();
    
        req.log.info("Report Generation Complete");
    
        missionSpecificSocket
          .to(missionId.toString())
          .emit("REPORT_GENERATION_COMPLETE", savedDoc);
      }

      res.status(200).json({
        status: true,
        message: "Successfully Generated ALL Plot Reports"
      });

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
}
