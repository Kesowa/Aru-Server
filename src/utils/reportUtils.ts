import { EventEmitter } from "stream";
import { logger } from "../app";
import { missionSpecificSocket } from "../socket";
import { Connection } from "amqplib";
import Document from "../models/document";
import { vectorProps } from "../schemas/vectorprops";

export const ReportEvents = new EventEmitter();

export const PLOT_REQ_QUEUE = "report.plot.req";
export const PLOT_RES_QUEUE = "report.plot.res";

export const BLOCK_REQ_QUEUE = "report.block.req";
export const BLOCK_RES_QUEUE = "report.block.res";

export async function Setup(conn: Connection) {
  // for plot report
  const plotReqChannel = await conn.createChannel();
  await plotReqChannel.assertQueue(PLOT_REQ_QUEUE, { durable: true });
  const plotResChannel = await conn.createChannel();
  await plotResChannel.assertQueue(PLOT_RES_QUEUE, { durable: true });
  ReportEvents.on(PLOT_REQ_QUEUE, function (req) {
    plotReqChannel.sendToQueue(
      PLOT_REQ_QUEUE,
      Buffer.from(JSON.stringify(req)),
      {
        persistent: true,
        contentType: "application/json",
      }
    );
  });
  plotResChannel
    .consume(PLOT_RES_QUEUE, function (msg) {
      plotResChannel.ack(msg);
      ReportEvents.emit(PLOT_RES_QUEUE, JSON.parse(msg.content.toString()));
    })
    .catch((e) => console.log(e));

  // for block report
  const blockReqChannel = await conn.createChannel();
  await blockReqChannel.assertQueue(BLOCK_REQ_QUEUE, { durable: true });
  const blockResChannel = await conn.createChannel();
  await blockResChannel.assertQueue(BLOCK_RES_QUEUE, { durable: true });
  ReportEvents.on(BLOCK_REQ_QUEUE, function (req) {
    blockReqChannel.sendToQueue(
      BLOCK_REQ_QUEUE,
      Buffer.from(JSON.stringify(req)),
      {
        persistent: true,
        contentType: "application/json",
      }
    );
  });
  blockResChannel
    .consume(BLOCK_RES_QUEUE, function (msg) {
      blockResChannel.ack(msg);
      ReportEvents.emit(BLOCK_RES_QUEUE, JSON.parse(msg.content.toString()));
    })
    .catch((e) => console.log(e));
}

export interface IPlotReportData {
  // data required for SS
  plotLayerpath: string;
  plotIdx: number;
  blockLayerpath: string;
  blockIdx: number;
  rasterLayerpath: string;
  plotLayerFilepath: string;
  tenantImagePath: string;

  // data generated after SS
  plotImageBuffer?: Buffer;
  blockImageBuffer?: Buffer;
  coverImageBuffer?: Buffer;
  frontViewImageBuffer?: Buffer;
  tenantImageBuffer?: Buffer;

  // all other data

  blockName?: string;
  date: string;
  users: string[];
  tenantName: string;

  // plot details
  plotArea: string;
  plotNo?: string;
  premiseNo?: string;
  pincode?: string;
  category?: string;
  infraction?: string;
  isGreenTopEligible?: string;
  isSolarPlantEligible?: string;
  hasTradeLicense?: string;
  tax?: string;

  // building details
  buildingArea: string;
  buildingFootprint: string;
  buildingAvailable?: string;
  floorCount?: string;
  buildingNo?: string;
  hasCompletionCertificate?: string;
  buildingHeight?: string;

  // block details
  blockArea: string;
  greeneryArea: string;
  canopyArea: string;
  waterbodyArea: string;
  greeneryPercent: string;
  canopyPercent: string;
  waterbodyPercent: string;
  garbageCollectionInfo?: string;
  averageBuildingHeight?: string;
  averageBlockHeight?: string;
  averageIncentives?: string;
}

export interface IAreaDesc {
  name: string;
  value: number;
}
export interface IOccupancyDesc {
  name: string;
  occupied: number;
  underConstruction: number;
  vacant: number;
}
export interface IAreaData {
  total: number;
  privateSpaces: IAreaDesc[];
  publicSpaces: IAreaDesc[];
  other: number;
}

export interface IDeliverable {
  name: string;
  layerpath: string;
  layerType: string;
  imgBuffer?: Buffer;
}

export interface IBlockReportData {
  categoryPieChart?: Buffer;
  statusPieChart?: Buffer;
  barChart?: Buffer;
  missionMapImg?: Buffer;
  tenantImageBuffer?: Buffer;

  blockLayerpath: string;
  blockIdx: number;
  rasterLayerpath: string;
  blockName: string;
  tenantImagePath: string;

  actionArea: string;
  missionCode: string;
  tenantName: string;
  date: string;
  users: string[];
  emails: string[];
  phoneNos: string[];

  area: IAreaData;
  occupancy: IOccupancyDesc[];

  roadCount: number;
  roadLength: number;
  cycleTrackLength: number;

  deliverables: IDeliverable[];
}

export type AruMetadata = {
  mission_id: string;
  user_id: string;
  tenant_id: string;
  filename: string;
};

export type PlotReportRequest = IPlotReportData & { metadata: AruMetadata };
export type BlockReportRequest = IBlockReportData & { metadata: AruMetadata };

export type ReportResponse = {
  size: number;
  success: boolean;
  metadata: AruMetadata;
  error?: string;
};

export const generatePlotReport = async (req: PlotReportRequest) => {
  const doc = await Document.findOne({
    tenantId: req.metadata.tenant_id,
    missionId: req.metadata.mission_id,
    name: req.metadata.filename,
  });
  if (doc) doc.delete();
  ReportEvents.emit(PLOT_REQ_QUEUE, req);
  logger.info(req, "SENT PLOT REPORT GENERATION REQUEST");
};

export const generateBlockReport = async (req: BlockReportRequest) => {
  const doc = await Document.findOne({
    tenantId: req.metadata.tenant_id,
    missionId: req.metadata.mission_id,
    name: req.metadata.filename,
  });
  if (doc) doc.delete();
  ReportEvents.emit(BLOCK_REQ_QUEUE, req);
  logger.info(req, "SENT BLOCK REPORT GENERATION REQUEST");
};

export const receiveReport = async (res: ReportResponse) => {
  if (res.success) {
    const docDB = new Document({
      name: res.metadata.filename,
      modDate: new Date(),
      fileSize: (Number(res.size) / (1024 * 1024)).toFixed(5),
      fileType: "docx",
      folderName: "root1234",
      filePath: `/documents/${res.metadata.filename}`,
      missionId: res.metadata.mission_id,
      tenantId: res.metadata.tenant_id,
      createdBy: res.metadata.user_id,
      updatedBy: res.metadata.user_id,
    });
    const savedDoc = await docDB.create();

    logger.info("Report Generation Complete");

    missionSpecificSocket
      .to(res.metadata.mission_id.toString())
      .emit("REPORT_GENERATION_COMPLETE", savedDoc);
  } else {
    logger.error(
      { error: res.error }, // mention plot index in error string from report-service
      "REPORT GENERATION FAILED for " + res.metadata.mission_id
    );
    missionSpecificSocket
      .to(res.metadata.mission_id.toString())
      .emit("REPORT_GENERATION_FAILED", { message: res.error }); // mention plot index in error string from report-service
  }
};

ReportEvents.on(PLOT_RES_QUEUE, function (res: ReportResponse) {
  logger.info(res, "RECEIVED REPORT GENERATION RESPONSE");
  receiveReport(res)
    .then(() => logger.info(res, "GENERATED REPORT"))
    .catch((err) => logger.error({ res, err }, "FAILED TO GENERATE REPORT"));
});
ReportEvents.on(BLOCK_RES_QUEUE, function (res: ReportResponse) {
  logger.info(res, "RECEIVED REPORT GENERATION RESPONSE");
  receiveReport(res)
    .then(() => logger.info(res, "GENERATED REPORT"))
    .catch((err) => logger.error({ res, err }, "FAILED TO GENERATE REPORT"));
});

export interface IPage1Properties {
  blockName: string;
  coverImageBuffer: Buffer;
  date: string;
  users: string[];
}

export interface IPage3Properties {
  // plot details
  plotArea: number; // generated
  plotNo: string; // provided
  premiseNo: string; // provided
  pincode: string; // provided
  category: string; // provided
  infraction: string; // provided
  isGreenTopEligible: string; // provided
  isSolarPlantEligible: string; // provided
  hasTradeLicense: string; // provided
  tax: string; // provided

  // building details
  buildingArea: number; // generated
  buildingFootprint: number; // generated, (building area / plot area) * 100% ??
  buildingAvailable: string; // provided
  floorCount: string; // provided
  buildingNo: string; // provided
  hasCompletionCertificate: string; // provided
  buildingHeight: string; // provided

  // block details
  greeneryPercent: number; // generated
  canopyPercent: number; // generated
  waterbodyPercent: number; // generated
  blockName: string; // provided
  garbageCollectionInfo: string; // provided
  averageBuildingHeight: string; // provided
  averageBlockHeight: string; // provided
  averageIncentives: string; // provided
}

export interface IPlotProperties {
  plotNo?: string;
  premiseNo?: string; // connects plot to buildings
  buildingAvailable?: string;
  pincode?: string;
  category?: string;
  shopFloor?: string; // no. of floor
  buildingStatus?: string; // completion certificate
  blockName?: string; // connects plot to block
  sys_id: string;

  // not present on test geojson
  sanctionedBuildingNo?: string;
  infraction?: string;
  isIncentiveEligible?: string;
  isGreenTopEligible?: string;
  isSolarPlantEligible?: string;
  hasTradeLicense?: string;
  tax?: string;
}

export interface IBuildingProperties {
  premiseNo: string; // connects building to plot
  height: number;
  sys_id: string; // system assigned, not user assigned
  blockName: string; // connects building to block
}

export interface IBlockProperties {
  blockName: string;
  averageBlockHeight: string;
  averageIncentives: string;
}

export interface IPlotReportError {
  layers: string[];
  plots: {
    plotNo: number[];
    premiseNo: number[];
    buildingAvailable: number[];
    pincode: number[];
    category: number[];
    shopFloor: number[];
    buildingStatus: number[];
    blockName: number[];
    sys_id: number[];
    sanctionedBuildingNo: number[];
    infraction: number[];
    isIncentiveEligible: number[];
    isGreenTopEligible: number[];
    isSolarPlantEligible: number[];
    hasTradeLicense: number[];
    tax: number[];
  };
  blocks: {
    blockName: number[];
    averageBlockHeight: number[];
    averageIncentives: number[];
  };
  buildings: {
    premiseNo: number[];
    height: number[];
    sys_id: number[];
    blockName: number[];
  };
}

export enum entityCategories {
  MOTORABLE_ROADS = "Motorable Roads",
  FOOTPATH = "Footpath",
  CYCLE_TRACK = "Cycle Track",
  PARKS_AND_GREENERY = "Parks & Green",
  WATERBODY = "Waterbody",
}

export const entityTypes: Record<entityCategories, vectorProps[]> = {
  [entityCategories.MOTORABLE_ROADS]: [
    vectorProps.FLYOVER,
    vectorProps.ROUNDABOUT,
    vectorProps.BRIDGE_FLYOVER,
    vectorProps.BRIDGE,
    vectorProps.CARRIAGE_WAY,
    vectorProps.ROAD,
    vectorProps.STREET,
  ],
  [entityCategories.FOOTPATH]: [vectorProps.FOOTPATH],
  [entityCategories.CYCLE_TRACK]: [vectorProps.CYCLE_TRACK],
  [entityCategories.PARKS_AND_GREENERY]: [
    vectorProps.PLAYGROUND,
    vectorProps.PARK,
    vectorProps.GREEN_VERGE,
    vectorProps.JUNGLE,
  ],
  [entityCategories.WATERBODY]: [
    vectorProps.DRAINAGE_NETWORK,
    vectorProps.CANAL,
    vectorProps.SEWERAGE_NETWORK,
    vectorProps.WATER_BODY,
  ],
};

export enum plotCategories {
  RESIDENTIAL = "Residential",
  PRIVATE_COMMERCIAL = "Private Commercial",
  GOVERNMENT = "Government",
  HOUSING_COMPLEX = "Housing Complex",
  GOVT_COMMERCIAL = "Govt. Commercial",
  COMMERCIAL = "Commercial",
  GOVERNMENT_COMMERCIAL = "Government Commercial",
}

export enum plotBuildingStatus {
  CONSTRUCTED = "Constructed",
  UNDER_CONSTRUCTION = "Under Construction",
  EMPTY_PLOT = "Empty Plot",
  WTP = "WTP",
}

export const privatePlotCategories = [
  plotCategories.PRIVATE_COMMERCIAL,
  plotCategories.RESIDENTIAL,
  plotCategories.GOVERNMENT_COMMERCIAL,
  plotCategories.GOVT_COMMERCIAL,
  plotCategories.HOUSING_COMPLEX,
];

export const publicPlotCategories = [plotCategories.GOVERNMENT];
