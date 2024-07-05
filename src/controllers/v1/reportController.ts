import * as turf from "@turf/turf";

import { Request } from "express";
import Mission from "../../models/mission";
import { AuthResponse } from "../../utils/interfaceUtils";
import Layer from "../../models/layer";
import { vectorProps } from "../../schemas/vectorprops";
import {
  DirPath,
  Directory,
  TITILER_SERVER,
  TITILER_STATIC,
} from "../../constants";
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
import {
  IBlockProperties,
  IBuildingProperties,
  IPlotProperties,
  IPlotReportData,
  IPlotReportError,
} from "../../utils/reportUtils/plot-report/types";
import { generatePlotReportDocument } from "../../utils/reportUtils/plot-report/report";
import { Feature, readGeoJson } from "../../utils/geojsonUtils";
import layerFiles from "../../models/layerFiles";
import User from "../../models/user";
import { readFile, saveFile } from "../../utils/dataUtils";
import { randomUUID } from "crypto";
import ObjectsToCsv from "objects-to-csv";
import { rasterProps } from "../../schemas/rasterprops";

export function findArea(features: Feature<turf.Geometry, turf.Properties>[]) {
  try {
    let totalArea = 0;
    const allIndependantLines: turf.Position[][] = [];
    for (const feature of features) {
      // Point or Position => number[] of length 2 => one coordinate
      // LineString => Position[]
      // MultiLineString and Polygon => Position[][]
      // MultiPolygon => Position[][][]
      // There are no other shapes defined under geometry specifications that can have an area
      if (
        ["MultiPolygon", "Polygon", "MultiLineString"].includes(
          feature.geometry.type
        )
      ) {
        if (feature.geometry.type === "MultiLineString") {
          for (const linestring of feature.geometry
            .coordinates as turf.Position[][]) {
            allIndependantLines.concat(linestring);
          }
          continue;
        }
        let polygons = feature.geometry.coordinates;
        if (feature.geometry.type === "Polygon") {
          polygons = [polygons as turf.Position[][]];
        }
        for (const polygon of polygons as turf.Position[][][]) {
          const area = turf.area(turf.polygon(polygon));
          totalArea += area;
        }
      }
    }
    if (allIndependantLines.length >= 3) {
      const area = turf.area(turf.polygon(allIndependantLines));
      totalArea += area;
    }
    return totalArea;
  } catch (error) {
    console.error(error);
    return 0;
  }
}

export function findLength(
  features: Feature<turf.Geometry, turf.Properties>[]
) {
  try {
    let totalLength = 0;
    for (const feature of features) {
      // LineString => Position[]
      // MultiLineString and Polygon => Position[][]
      // There are no other shapes defined under geometry specifications that can have a length
      if (
        ["MultiLineString", "LineString", "Polygon"].includes(
          feature.geometry.type
        )
      ) {
        const lines =
          feature.geometry.type === "LineString"
            ? [feature.geometry.coordinates as turf.Position[]]
            : (feature.geometry.coordinates as turf.Position[][]);
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

export function countPolygons(
  features: Feature<turf.Geometry, turf.Properties>[]
) {
  try {
    let count = 0;
    for (const feature of features) {
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

function assignOccupancy(layerType: string, idx: number, data: IData) {
  if (vacantTypes.includes(layerType)) {
    data.occupancy[idx].vacant++;
  } else if (underConstructionTypes.includes(layerType)) {
    data.occupancy[idx].underConstruction++;
  } else {
    data.occupancy[idx].occupied++;
  }
}

export async function saveScreenshot(
  vectorFeatures: Feature<turf.Geometry, turf.Properties>[],
  rasterFilePaths: string[],
  logger: pino.Logger
) {
  try {
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
  } catch (error) {
    logger.error("Error while taking screenshot: ", error);
    return null;
  }
}

export const generateReport = async (
  req: Request<
    {},
    {},
    {
      missionId: string;
    }
  >,
  res: AuthResponse
) => {
  {
    const { missionId } = req.body;
    try {
      // initializing all numbers and texts
      const data: IData = {
        missionHeading: "",
        missionSubHeading: "",
        missionMapImg: null,
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
        deliverables: [],
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
      });

      for (const layer of vectorLayers) {
        const gjson = await readGeoJson<
          Feature<turf.Geometry, turf.Properties>
        >(DirPath(Directory.DEFAULT, layer.layerpath));
        const currLayerArea = findArea(gjson.features);
        const currLayerLength = findLength(gjson.features);
        data.area.total += currLayerArea;
        // check the layer type and accordingly add area to respective type
        if (privateCommercialLayerTypes.includes(layer.vector)) {
          data.area.privateSpaces[0].value += currLayerArea;
          assignOccupancy(layer.vector, 0, data);
        } else if (residentialLayerTypes.includes(layer.vector)) {
          data.area.privateSpaces[1].value += currLayerArea;
          assignOccupancy(layer.vector, 1, data);
        } else if (govtCommercialLayerTypes.includes(layer.vector)) {
          data.area.privateSpaces[2].value += currLayerArea;
          assignOccupancy(layer.vector, 2, data);
        } else if (housingComplexLayerTypes.includes(layer.vector)) {
          data.area.privateSpaces[3].value += currLayerArea;
          assignOccupancy(layer.vector, 3, data);
        } else if (govtLayerTypes.includes(layer.vector)) {
          data.area.publicSpaces[0].value += currLayerArea;
          assignOccupancy(layer.vector, 4, data);
        } else if (motorableRoadsLayerTypes.includes(layer.vector)) {
          data.area.publicSpaces[1].value += currLayerArea;
          data.roadCount++;
          data.roadLength += currLayerLength;
        } else if (footpathLayerTypes.includes(layer.vector)) {
          data.area.publicSpaces[2].value += currLayerArea;
        } else if (cycleTrackLayerTypes.includes(layer.vector)) {
          data.area.publicSpaces[3].value += currLayerArea;
          data.cycleTrackLength += currLayerLength;
        } else if (greeneryLayerTypes.includes(layer.vector)) {
          data.area.publicSpaces[4].value += currLayerArea;
        } else if (waterBodyLayerTypes.includes(layer.vector)) {
          data.area.publicSpaces[5].value += currLayerArea;
        } else {
          data.area.other += currLayerArea;
        }
      }

      // categorizing the geojson for map and capturing images
      for (const d in deliverableTypes) {
        const deliverableLayers = vectorLayers.filter((layer) =>
          deliverableTypes[d].includes(layer.vector)
        );
        const deliverableFeatures: Feature<turf.Geometry, turf.Properties>[] =
          [];
        for (const layer of deliverableLayers) {
          const layerGeojson = await readGeoJson<
            Feature<turf.Geometry, turf.Properties>
          >(DirPath(Directory.DEFAULT, layer.layerpath));
          deliverableFeatures.push(...layerGeojson.features);
        }
        if (deliverableFeatures.length > 0) {
          const deliverableImgBuffer = await saveScreenshot(
            deliverableFeatures,
            [],
            req.log
          );
          data.deliverables.push({
            name: d,
            imgBuffer: deliverableImgBuffer,
          });

          if (d === "OVERVIEW") data.missionMapImg = deliverableImgBuffer;
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
      const filename = `${mission.name}${mission._id}-block_report.docx`;
      const { size } = await saveFile(Directory.DOCUMENTS, filename, buffer);

      const docDB = new Document({
        name: filename,
        modDate: new Date(),
        fileSize: (Number(size) / (1024 * 1024)).toFixed(5),
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
      missionSpecificSocket
        .to(missionId.toString())
        .emit("REPORT_GENERATION_FAILED", error);
    }
  }
};

export const generatePlotReport = async (
  req: Request<
    {},
    {},
    {
      missionId: string;
    }
  >,
  res: AuthResponse
) => {
  {
    const { missionId } = req.body;
    const errors: IPlotReportError = {
      layers: [],
      plots: {
        plotNo: [],
        premiseNo: [],
        buildingAvailable: [],
        pincode: [],
        category: [],
        shopFloor: [],
        buildingStatus: [],
        blockName: [],
        sys_id: [],
        sanctionedBuildingNo: [],
        infraction: [],
        isIncentiveEligible: [],
        isGreenTopEligible: [],
        isSolarPlantEligible: [],
        hasTradeLicense: [],
        tax: [],
      },
      blocks: {
        blockName: [],
        averageBlockHeight: [],
        averageIncentives: [],
      },
      buildings: {
        premiseNo: [],
        height: [],
        sys_id: [],
        blockName: [],
      },
    };

    try {
      const [
        actionAreaLayer,
        plotLayer,
        buildingFootprintLayer,
        waterbodyLayer,
        rasterLayer,
        treeCoverLayer,
        greeneryLayer,
        garbageCollectionLayer,
      ] = await Promise.all([
        Layer.findOne({
          tenantId: res.locals.user.tenantId._id,
          missionId: req.body.missionId,
          vector: vectorProps.BLOCK_BOUNDARY,
        }),
        Layer.findOne({
          tenantId: res.locals.user.tenantId._id,
          missionId: req.body.missionId,
          vector: vectorProps.PLOT,
        }),
        Layer.findOne({
          tenantId: res.locals.user.tenantId._id,
          missionId: req.body.missionId,
          vector: vectorProps.BUILDING_FOOTPRINT,
        }),
        Layer.findOne({
          tenantId: res.locals.user.tenantId._id,
          missionId: req.body.missionId,
          vector: vectorProps.WATER_BODY,
        }),
        Layer.findOne({
          tenantId: res.locals.user.tenantId._id,
          missionId: req.body.missionId,
          raster: rasterProps.ORTHO,
        }),
        Layer.findOne({
          tenantId: res.locals.user.tenantId._id,
          missionId: req.body.missionId,
          vector: vectorProps.JUNGLE,
        }),
        Layer.findOne({
          tenantId: res.locals.user.tenantId._id,
          missionId: req.body.missionId,
          vector: vectorProps.GREEN_VERGE,
        }),
        Layer.findOne({
          tenantId: res.locals.user.tenantId._id,
          missionId: req.body.missionId,
          vector: vectorProps.GARBAGE_COLLECTION_POINT,
        }),
      ]);

      if (!actionAreaLayer) errors.layers.push(vectorProps.BLOCK_BOUNDARY);
      if (!plotLayer) errors.layers.push(vectorProps.PLOT);
      if (!buildingFootprintLayer)
        errors.layers.push(vectorProps.BUILDING_FOOTPRINT);
      if (!waterbodyLayer) errors.layers.push(vectorProps.WATER_BODY);
      if (!rasterLayer) errors.layers.push(rasterProps.ORTHO);
      if (!treeCoverLayer) errors.layers.push(vectorProps.JUNGLE);
      if (!greeneryLayer) errors.layers.push(vectorProps.GREEN_VERGE);
      if (!garbageCollectionLayer)
        errors.layers.push(vectorProps.GARBAGE_COLLECTION_POINT);

      if (errors.layers.length > 0) {
        return res.status(400).json({
          status: false,
          message: "Some layers are missing in the mission",
          errors,
        });
      }

      const rasterFilePath = TITILER_STATIC + rasterLayer.layerpath;
      const plotGeojson = await readGeoJson<
        Feature<turf.MultiPolygon, IPlotProperties>
      >(DirPath(Directory.DEFAULT, plotLayer.layerpath));
      const buildingsGeojson = await readGeoJson<
        Feature<turf.MultiPolygon, IBuildingProperties>
      >(DirPath(Directory.DEFAULT, buildingFootprintLayer.layerpath));
      const actionAreaGeojson = turf.featureCollection(
        (
          await readGeoJson<Feature<turf.MultiPolygon, IBlockProperties>>(
            DirPath(Directory.DEFAULT, actionAreaLayer.layerpath)
          )
        ).features
      );

      // multiple plot reports will be generated, one for each flagged plot
      // use Plot_no to join building_footprint with each plot. A single plot can have multiple building, and hence multiple building footprints, on top of it.
      const flaggedPlotGeojson = plotGeojson.features.filter((_, index) =>
        plotLayer.flaggedFeatures.includes(index)
      );

      let foundError = false;

      plotGeojson.features.forEach((plot, index) => {
        for (const key of Object.keys(errors.plots)) {
          if (!plot.properties[key]) {
            foundError = true;
            errors.plots[key].push(index);
          }
        }
      });
      actionAreaGeojson.features.forEach((block, index) => {
        for (const key of Object.keys(errors.blocks)) {
          if (!block.properties[key]) {
            foundError = true;
            errors.blocks[key].push(index);
          }
        }
      });
      buildingsGeojson.features.forEach((building, index) => {
        for (const key of Object.keys(errors.buildings)) {
          if (!building.properties[key]) {
            foundError = true;
            errors.buildings[key].push(index);
          }
        }
      });

      if (foundError) {
        // generate error csv
        const rows = [];
        errors.layers.forEach((layerType) => {
          rows.push({
            "Error Location": "Mission",
            "Invalid / Missing Property": `Layer of type ${layerType}`,
            "Feature Indices": "N/A",
          });
        });
        Object.keys(errors.plots).map((key) => {
          if (errors.plots[key].length > 0) {
            rows.push({
              "Error Location": "Plot Layer",
              "Invalid / Missing Property": `${key} property`,
              "Feature Indices": errors.plots[key].join(","),
            });
          }
        });
        Object.keys(errors.blocks).map((key) => {
          if (errors.blocks[key].length > 0) {
            rows.push({
              "Error Location": "Action Area Layer",
              "Invalid / Missing Property": `${key} property`,
              "Feature Indices": errors.blocks[key].join(","),
            });
          }
        });
        Object.keys(errors.buildings).map((key) => {
          if (errors.buildings[key].length > 0) {
            rows.push({
              "Error Location": "Building Footprint Layer",
              "Invalid / Missing Property": `${key} property`,
              "Feature Indices": errors.buildings[key].join(","),
            });
          }
        });
        const csv = new ObjectsToCsv(rows);
        const filename = Math.floor(Math.random() * 620000);
        const file = DirPath(Directory.CSV, `${filename}.csv`);
        await csv.toDisk(file);
        return res.json({
          status: false,
          message: "Missing properties in features",
          errors,
          csvPath: `/csv/${filename}.csv`,
        });
      }

      const PlotsByBlock: Map<
        string,
        Array<Feature<turf.MultiPolygon, IPlotProperties>>
      > = new Map();

      for (const plotFeature of flaggedPlotGeojson) {
        const block = PlotsByBlock.get(plotFeature.properties.blockName);
        if (block != undefined) {
          block.push(plotFeature);
        } else {
          const array = [];
          array.push(plotFeature);
          PlotsByBlock.set(plotFeature.properties.blockName, array);
        }
      }
      // plot images (one per plot, fail safe if absent)
      // const flaggedPlotFile = await layerFiles.find({
      //   tenantId: res.locals.user.tenantId._id,
      //   layerId: plotLayer._id,
      //   sys_Id: { $in: flaggedPlotGeojson.map(plot => plot.properties.sys_id) }
      // });

      // date
      const now = new Date();
      const date = now.toLocaleDateString("in");

      // currently considering all users who worked on the layers, to be mentioned on report cover page
      const userIds = Array.from(
        new Set<string>([
          String(plotLayer.createdBy),
          String(plotLayer.updatedBy),
          String(actionAreaLayer.createdBy),
          String(actionAreaLayer.updatedBy),
          String(buildingFootprintLayer.createdBy),
          String(buildingFootprintLayer.updatedBy),
          String(waterbodyLayer.createdBy),
          String(waterbodyLayer.updatedBy),
          String(rasterLayer.createdBy),
          String(rasterLayer.updatedBy),
          String(treeCoverLayer.createdBy),
          String(treeCoverLayer.updatedBy),
          String(greeneryLayer.createdBy),
          String(greeneryLayer.updatedBy),
        ])
      ); // all unique userIds

      const userDocs = await Promise.all(
        userIds.map((id) => User.findById(id, { name: 1 }))
      );
      const users = userDocs.map((user) => user.name);
      res.status(200).json({
        status: true,
        message: "Data collected, generating plot reports...",
      });

      // =================================== DETAILS THAT WON'T VARY ACROSS REPORTS OF DIFFERENT PLOTS ==================================

      // ************* COVER PAGE DETAILS ****************
      // Cover page in sample report shows block boundary and all the plots in the block, so it will be same for all plot reports
      const coverPageVectorFeatures = [
        ...actionAreaGeojson.features,
        ...plotGeojson.features,
      ];
      const coverImageBuffer = await saveScreenshot(
        coverPageVectorFeatures,
        [rasterFilePath],
        req.log
      );
      // await fs.writeFile(DirPath(Directory.DOCUMENTS, "coverImage.png"), coverImageBuffer); // For Debugging

      const waterbodyGeojson = await readGeoJson(
        DirPath(Directory.DEFAULT, waterbodyLayer.layerpath)
      );

      const combinedWaterbody = turf.combine(
        turf.featureCollection(waterbodyGeojson.features)
      );

      const greeneryGeojson = await readGeoJson(
        DirPath(Directory.DEFAULT, greeneryLayer.layerpath)
      );

      const combinedGreenery = turf.combine(
        turf.featureCollection(greeneryGeojson.features)
      );

      const canopyGeojson = await readGeoJson(
        DirPath(Directory.DEFAULT, treeCoverLayer.layerpath)
      );

      const combinedCanopy = turf.combine(
        turf.featureCollection(canopyGeojson.features)
      );

      const combinedBuildings = turf.combine(
        turf.featureCollection(buildingsGeojson.features)
      );

      const garbageCollectionGeojson = turf.featureCollection(
        (
          await readGeoJson(
            DirPath(Directory.DEFAULT, garbageCollectionLayer.layerpath)
          )
        ).features
      );

      // ==================================================================================================================================

      // ===================================== DETAILS THAT VARY ACROSS REPORTS OF DIFFERENT PLOTS ========================================

      for (const blockName of PlotsByBlock.keys()) {
        // ************* BLOCK DETAILS ******************
        // All plots belong to same block, so block properties need not be calculated repeatedly

        const blockGeojson = actionAreaGeojson.features.find(
          (block) => block.properties.blockName == blockName
        );
        const blockArea = turf.area(blockGeojson);
        const blockImageBuffer = await saveScreenshot(
          [blockGeojson],
          [rasterFilePath],
          req.log
        );
        const blockProperties = blockGeojson.properties; // block layer will have only one MultiPolygon features

        const intersectWaterbody = turf.intersect(
          combinedWaterbody.features[0],
          blockGeojson
        );
        const waterbodyArea =
          intersectWaterbody === null ? 0 : turf.area(intersectWaterbody);

        const intersectGreenery = turf.intersect(
          combinedGreenery.features[0],
          blockGeojson
        );
        const greeneryArea =
          intersectGreenery === null ? 0 : turf.area(intersectGreenery);

        const intersectCanopy = turf.intersect(
          combinedCanopy.features[0],
          blockGeojson
        );
        const canopyArea =
          intersectCanopy === null ? 0 : turf.area(intersectCanopy);

        const intersectGarbageCollection = turf.pointsWithinPolygon(
          garbageCollectionGeojson,
          blockGeojson
        );

        const garbageCollectionCount =
          intersectGarbageCollection.features.length;

        const averageBuildingHeight = buildingsGeojson.features
          .filter((building) => building.properties.blockName === blockName)
          .map((building) => building.properties.height)
          .reduce((prev, curr) => Number(curr) + prev, 0);

        for (const plotFeature of PlotsByBlock.get(blockName)) {
          try {
            const filename = `plot_report | ${
              plotFeature.properties.plotNo || "plotNo"
            } | ${plotFeature.properties.premiseNo || "premiseNo"} | ${
              plotFeature.properties.sys_id
            }.docx`;
            const reportExists = await Document.exists({
              tenantId: res.locals.user.tenantId._id,
              missionId,
              name: filename,
            });
            if (reportExists) {
              req.log.warn(
                "plot report exists, skipping. filename: " + filename
              );
            }
            const plotProperties = plotFeature.properties;

            // ******************** PLOT DETAILS ***********************

            // // front view image
            // const plotLayerFile = await layerFiles.findOne({ layerId: plotLayerId });
            // const frontViewImageBuffer = await fs.readFile(DirPath(Directory.DEFAULT, plotLayerFile.filePath));
            const plotArea = findArea([plotFeature]);
            const plotImageBuffer = await saveScreenshot(
              [plotFeature],
              [rasterFilePath],
              req.log
            );

            // ******************** BUILDING DETAILS ************************

            // for multiple buildings:
            // const plotBuildingFeatures = buildingsGeojson.features.filter((feature) => (feature.properties.premiseNo === plotProperties.premiseNo));

            // for single building:
            const plotBuildingFeature = buildingsGeojson.features.find(
              (feature) =>
                feature.properties.premiseNo === plotProperties.premiseNo
            );

            const plotLayerFile = await layerFiles.findOne({
              tenantId: res.locals.user.tenantId._id,
              layerId: plotLayer._id,
              sys_Id: plotFeature.properties.sys_id,
            });
            const frontViewImageBuffer = await readFile(
              DirPath(Directory.DEFAULT, plotLayerFile.filePath)
            );

            const buildingProperties = plotBuildingFeature.properties;

            const buildingArea = findArea([plotBuildingFeature]);

            // ================= PUTTING TOGETHER THE DATA =======================

            const data: IPlotReportData = {
              // cover page details

              date,
              users,
              coverImageBuffer,

              // plot details

              frontViewImageBuffer,
              plotImageBuffer,
              plotArea: plotArea.toFixed(2),
              plotNo: plotProperties.plotNo, // although named as plot "number", it can contain non-numeric characters
              premiseNo: plotProperties.premiseNo, // although named as premise "number", can contain non-numeric characters
              pincode: Number.isNaN(Number(plotProperties.pincode))
                ? null
                : plotProperties.pincode, // must be numeric
              category: plotProperties.category,
              infraction: plotProperties.infraction, // "Yes" or "No"
              isGreenTopEligible: plotProperties.isGreenTopEligible, // "Yes" or "No"
              isSolarPlantEligible: plotProperties.isSolarPlantEligible, // "Yes" or "No"
              hasTradeLicense: plotProperties.hasTradeLicense, // "Yes" or "No"
              tax: Number.isNaN(Number(plotProperties.tax))
                ? null
                : plotProperties.tax, // must be numeric

              // building details

              buildingArea: buildingArea.toFixed(2),
              buildingFootprint: ((buildingArea / plotArea) * 100).toFixed(2),
              buildingAvailable: plotProperties.buildingAvailable, // "Yes" or "No"
              floorCount: plotProperties.shopFloor, // although seems like a number, can contain string like "G+(some number)"
              buildingNo: plotProperties.sanctionedBuildingNo, // no data on format
              hasCompletionCertificate:
                plotProperties.buildingStatus === "Constructed" ? "Yes" : "No",
              buildingHeight: String(buildingProperties.height), // must be numeric

              // block details

              blockImageBuffer,
              blockArea: blockArea.toFixed(2),
              greeneryArea: greeneryArea.toFixed(2),
              canopyArea: canopyArea.toFixed(2),
              waterbodyArea: waterbodyArea.toFixed(2),
              greeneryPercent: ((greeneryArea / blockArea) * 100).toFixed(2),
              canopyPercent: ((canopyArea / blockArea) * 100).toFixed(2),
              waterbodyPercent: ((waterbodyArea / blockArea) * 100).toFixed(2),
              blockName: plotProperties.blockName,
              garbageCollectionInfo: String(garbageCollectionCount),
              averageBuildingHeight: averageBuildingHeight.toFixed(2),
              averageBlockHeight: Number.isNaN(
                Number(blockProperties.averageBlockHeight)
              )
                ? null
                : blockProperties.averageBlockHeight, // must be numeric
              averageIncentives: Number.isNaN(
                Number(blockProperties.averageIncentives)
              )
                ? null
                : blockProperties.averageIncentives, // must be numeric
            };

            // req.log.info(data);

            // saving the document
            const doc = generatePlotReportDocument(data);
            const buffer = await Packer.toBuffer(doc);
            const filenamePath = randomUUID() + ".docx";
            const { size } = await saveFile(
              Directory.DOCUMENTS,
              filenamePath,
              buffer
            );

            await Document.findOneAndDelete({
              tenantId: res.locals.user.tenantId._id,
              missionId,
              name: filename,
            });

            const docDB = new Document({
              name: filename,
              modDate: new Date(),
              fileSize: (Number(size) / (1024 * 1024)).toFixed(5),
              fileType: "docx",
              folderName: "root1234",
              filePath: `/documents/${filenamePath}`,
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
          } catch (err) {
            req.log.error(
              { err, plot: plotFeature.properties },
              "REPORT GENERATION FAILED for " + missionId
            );
            missionSpecificSocket
              .to(missionId.toString())
              .emit("REPORT_GENERATION_FAILED", { ...err, plotFeature });
          }
        }
      }
    } catch (error) {
      req.log.error(error);
      missionSpecificSocket
        .to(missionId.toString())
        .emit("REPORT_GENERATION_FAILED", error);
    }
  }
};
