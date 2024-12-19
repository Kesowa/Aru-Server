import * as turf from "@turf/turf";

import { Request } from "express";
import { AuthResponse } from "../../utils/interfaceUtils";
import Layer from "../../models/layer";
import { vectorProps } from "../../schemas/vectorprops";
import { DirPath, Directory } from "../../constants";
import Document from "../../models/document";
import { missionSpecificSocket } from "../../socket";
import {
  entityCategories,
  entityTypes,
  IAreaData,
  IBlockProperties,
  IBlockReportData,
  IBuildingProperties,
  IOccupancyDesc,
  IPlotProperties,
  IPlotReportData,
  plotBuildingStatus,
  plotCategories,
  privatePlotCategories,
  publicPlotCategories,
} from "../../utils/reportUtils";
import {
  generatePlotReport as generatePlotReportDocument,
  generateBlockReport as generateBlockReportDocument,
} from "../../utils/reportUtils";
import { Feature, readGeoJson } from "../../utils/geojsonUtils";
import layerFiles from "../../models/layerFiles";
import User from "../../models/user";
import { saveFile } from "../../utils/dataUtils";
import { randomUUID } from "crypto";
import ObjectsToCsv from "objects-to-csv";
import { rasterProps } from "../../schemas/rasterprops";
import {
  PlotPropertiesSchema,
  BlockPropertiesSchema,
  BuildingPropertiesSchema,
} from "../../../aru-common/schemas/properties";
import z from "zod";
import Mission from "../../models/mission";
import { IUser } from "../../schemas/user";
import Flight from "../../models/flight";

export const generateBlockReport = async (
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
      const rasterLayer = await Layer.findOne({
        missionId: missionId,
        type: "Raster",
      });

      const vectorLayers = await Layer.find({
        missionId: missionId,
        type: "Vector",
      });

      const blockLayer = vectorLayers.find(
        (l) => l.vector === vectorProps.BLOCK_BOUNDARY
      );
      const plotLayer = vectorLayers.find((l) => l.vector === vectorProps.PLOT);

      const blockFeatures = (
        await readGeoJson<Feature<turf.MultiPolygon, IBlockProperties>>(
          DirPath(Directory.DEFAULT, blockLayer.layerpath)
        )
      ).features;

      const plotFeatures = (
        await readGeoJson<Feature<turf.MultiPolygon, IPlotProperties>>(
          DirPath(Directory.DEFAULT, plotLayer.layerpath)
        )
      ).features;

      // date
      const now = new Date();
      const yyyy = now.getFullYear().toString();
      let mm = (now.getMonth() + 1).toString();
      let dd = now.getDate().toString();
      if (parseInt(dd) < 10) dd = "0" + dd;
      if (parseInt(mm) < 10) mm = "0" + mm;

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

      const deliverables = vectorLayers
        .filter((l) => l.vector !== vectorProps.BLOCK_BOUNDARY)
        .map(({ name, layerpath, vector }) => ({
          name,
          layerpath,
          layerType: vector,
        }));

      for (const blockIdx of blockLayer.flaggedFeatures) {
        const blockFeature = blockFeatures[blockIdx];
        const plotsInBlock = plotFeatures.filter(
          (f) => f.properties.blockName === blockFeature.properties.blockName
        );
        req.log.info("Number of plots: " + String(plotsInBlock.length));
        try {
          const filename = `block_report | ${
            blockFeature.properties.blockName || "blockName"
          }.docx`;
          const reportExists = await Document.exists({
            tenantId: res.locals.user.tenantId._id,
            missionId,
            name: filename,
          });
          if (reportExists) {
            req.log.warn(
              "block report exists, skipping. filename: " + filename
            );
          }

          const processedLayerData: {
            area: number;
            length: number;
            vector: vectorProps;
          }[] = [];

          for (const layer of vectorLayers) {
            req.log.info("Processing layer: " + layer.name);
            try {
              const layerGeojson = await readGeoJson(
                DirPath(Directory.DEFAULT, layer.layerpath)
              );
              const combinedFeatures = turf.combine(
                turf.featureCollection(layerGeojson.features)
              );
              const intersection = turf.intersect(
                combinedFeatures.features[0],
                blockFeature
              );
              processedLayerData.push({
                vector: layer.vector,
                area: intersection ? turf.area(intersection) : 0,
                length: intersection ? turf.length(intersection) : 0,
              });
            } catch (err) {
              req.log.error("Error in processing layer: " + layer.name);
              req.log.error(err);
            }
          }

          const area: IAreaData = {
            total: turf.area(blockFeature),
            privateSpaces: [],
            publicSpaces: [],
            other: 0,
          };
          const occupancy: IOccupancyDesc[] = [];

          const areaByCategory = new Map<string, number>();
          const occupancyByCategory: Map<
            string,
            {
              occupied: number;
              underConstruction: number;
              vacant: number;
            }
          > = new Map();

          for (const plot of plotsInBlock) {
            const plotCategory = plot.properties.category;
            areaByCategory.set(
              plotCategory,
              (areaByCategory.get(plotCategory) || 0) + turf.area(plot)
            );

            const plotStatus = plot.properties.buildingStatus;
            occupancyByCategory.set(plotCategory, {
              occupied:
                (occupancyByCategory.get(plotCategory)?.occupied || 0) +
                (plotStatus === plotBuildingStatus.CONSTRUCTED ? 1 : 0),
              underConstruction:
                (occupancyByCategory.get(plotCategory)?.underConstruction ||
                  0) +
                (plotStatus === plotBuildingStatus.UNDER_CONSTRUCTION ? 1 : 0),
              vacant:
                (occupancyByCategory.get(plotCategory)?.vacant || 0) +
                (plotStatus === plotBuildingStatus.EMPTY_PLOT ? 1 : 0),
            });
          }

          for (const [c, a] of areaByCategory) {
            if (privatePlotCategories.includes(c as plotCategories))
              area.privateSpaces.push({ name: c, value: a });
            else if (publicPlotCategories.includes(c as plotCategories))
              area.publicSpaces.push({ name: c, value: a });
            else area.other += a;
          }

          for (const [c, obj] of occupancyByCategory)
            occupancy.push({
              name: c,
              ...obj,
            });

          const data: IBlockReportData = {
            // DONE
            blockIdx,
            blockLayerpath: blockLayer.layerpath,
            rasterLayerpath: rasterLayer.layerpath,
            blockName: blockFeature.properties.blockName,
            actionArea: blockLayer.name,
            missionCode: mission.name.split("||")[0].trim(),
            date: `${dd}/${mm}/${yyyy}`,
            users: [mission.user.name, flight.pilotID.name],
            emails: [mission.user.email, flight.pilotID.email],
            phoneNos: [mission.user.phoneNo, flight.pilotID.phoneNo],
            deliverables,
            roadCount: processedLayerData.filter((d) =>
              entityTypes[entityCategories.MOTORABLE_ROADS].includes(d.vector)
            ).length,
            roadLength: processedLayerData
              .filter((d) =>
                entityTypes[entityCategories.MOTORABLE_ROADS].includes(d.vector)
              )
              .reduce(
                (acc, curr) => ({ ...curr, length: acc.length + curr.length }),
                { length: 0, area: 0, vector: "" as vectorProps }
              ).length,
            cycleTrackLength: processedLayerData
              .filter((d) =>
                entityTypes[entityCategories.CYCLE_TRACK].includes(d.vector)
              )
              .reduce(
                (acc, curr) => ({ ...curr, length: acc.length + curr.length }),
                { length: 0, area: 0, vector: "" as vectorProps }
              ).length,
            area,
            occupancy,
            tenantName: res.locals.user.tenantId.name,
            tenantImagePath: res.locals.user.tenantId.avatar,
          };

          req.log.info(data);

          await generateBlockReportDocument({
            ...data,
            metadata: {
              filename,
              tenant_id: String(res.locals.user.tenantId._id),
              user_id: String(res.locals.user._id),
              mission_id: missionId,
            },
          });
        } catch (err) {
          req.log.error(
            { err, block: blockFeature.properties },
            "REPORT GENERATION FAILED for " + missionId
          );
          missionSpecificSocket
            .to(missionId.toString())
            .emit("REPORT_GENERATION_FAILED", { ...err, blockFeature });
        }
      }

      res.status(200).json({
        status: true,
        message: "Data collection complete... Report generation started!",
      });
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
    const errors = {
      layers: [],
      plots: {},
      blocks: {},
      buildings: {},
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
      // const flaggedPlotGeojson = plotGeojson.features.map((feature, index) => {
      //   if (plotLayer.flaggedFeatures.includes(index)) return { plotIdx: index, feature };
      // }).filter(e => !!e);

      let foundError = false;

      plotGeojson.features.forEach((plot, index) => {
        try {
          PlotPropertiesSchema.parse(plot.properties);
        } catch (error) {
          const zodErrors = (error as z.ZodError).errors;
          for (const zodError of zodErrors) {
            const prop = String(zodError.path[0]);
            foundError = true;
            if (errors.plots[prop]) errors.plots[prop].push(index);
            else errors.plots[prop] = [index];
          }
        }
      });
      actionAreaGeojson.features.forEach((block, index) => {
        try {
          BlockPropertiesSchema.parse(block.properties);
        } catch (error) {
          const zodErrors = (error as z.ZodError).errors;
          for (const zodError of zodErrors) {
            const prop = String(zodError.path[0]);
            foundError = true;
            if (errors.blocks[prop]) errors.blocks[prop].push(index);
            else errors.blocks[prop] = [index];
          }
        }
      });
      buildingsGeojson.features.forEach((building, index) => {
        try {
          BuildingPropertiesSchema.parse(building.properties);
        } catch (error) {
          const zodErrors = (error as z.ZodError).errors;
          for (const zodError of zodErrors) {
            const prop = String(zodError.path[0]);
            foundError = true;
            if (errors.buildings[prop]) errors.buildings[prop].push(index);
            else errors.buildings[prop] = [index];
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
        const csvData = await csv.toString();
        const { filepath } = await saveFile(
          Directory.TEMP,
          randomUUID() + ".csv",
          csvData
        );
        return res.json({
          status: false,
          message: "Missing properties in features",
          errors,
          csvPath: filepath,
        });
      }

      const PlotsByBlock: Map<
        string,
        {
          blockIdx: number;
          blockFeature: Feature<turf.MultiPolygon, IBlockProperties>;
          plots: Array<{
            plotIdx: number;
            feature: Feature<turf.MultiPolygon, IPlotProperties>;
          }>;
        }
      > = new Map();

      for (const plotIdx of plotLayer.flaggedFeatures) {
        const blockName = plotGeojson.features[plotIdx].properties.blockName;
        const blockFound = PlotsByBlock.get(blockName);
        if (blockFound != undefined) {
          blockFound.plots.push({
            plotIdx,
            feature: plotGeojson.features[plotIdx],
          });
        } else {
          const blockIdx = actionAreaGeojson.features.findIndex(
            (block) => block.properties.blockName == blockName
          );
          if (blockIdx != -1) {
            PlotsByBlock.set(
              plotGeojson.features[plotIdx].properties.blockName,
              {
                blockIdx,
                blockFeature: actionAreaGeojson.features[blockIdx],
                plots: [
                  {
                    plotIdx,
                    feature: plotGeojson.features[plotIdx],
                  },
                ],
              }
            );
          }
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

      for (const [blockName, blockData] of PlotsByBlock) {
        // ************* BLOCK DETAILS ******************
        // All plots belong to same block, so block properties need not be calculated repeatedly

        const blockGeojson = blockData.blockFeature;
        const blockArea = turf.area(blockGeojson);
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

        for (const { plotIdx, feature: plotFeature } of blockData.plots) {
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
            const plotArea = turf.area(plotFeature);

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

            const buildingProperties = plotBuildingFeature.properties;

            const buildingArea = turf.area(plotBuildingFeature);

            // ================= PUTTING TOGETHER THE DATA =======================

            const data: IPlotReportData = {
              plotLayerpath: plotLayer.layerpath,
              blockLayerpath: actionAreaLayer.layerpath,
              rasterLayerpath: rasterLayer.layerpath,
              plotLayerFilepath: plotLayerFile.filePath,

              plotIdx,
              blockIdx: blockData.blockIdx,

              // cover page details

              date,
              users,
              tenantName: res.locals.user.tenantId.name,
              tenantImagePath: res.locals.user.tenantId.avatar,

              // plot details

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

            await generatePlotReportDocument({
              ...data,
              metadata: {
                filename,
                tenant_id: String(res.locals.user.tenantId._id),
                user_id: String(res.locals.user._id),
                mission_id: missionId,
              },
            });
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
