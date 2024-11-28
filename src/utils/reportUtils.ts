import { EventEmitter } from "stream";
import { logger } from "../app";
import { missionSpecificSocket } from "../socket";
import { Connection } from "amqplib";
import Document from "../models/document";

export const ReportEvents = new EventEmitter();

export const REQ_QUEUE = "report.generate.req";
export const RES_QUEUE = "report.generate.res";

export async function Setup(conn: Connection) {
  const reqChannel = await conn.createChannel();
  await reqChannel.assertQueue(REQ_QUEUE, { durable: true });
  const resChannel = await conn.createChannel();
  await resChannel.assertQueue(RES_QUEUE, { durable: true });
  ReportEvents.on(REQ_QUEUE, function(req) {
    reqChannel.sendToQueue(REQ_QUEUE, Buffer.from(JSON.stringify(req)), {
      persistent: true,
      contentType: "application/json",
    });
  });
  resChannel.consume(RES_QUEUE, function(msg) {
    resChannel.ack(msg);
    ReportEvents.emit(RES_QUEUE, JSON.parse(msg.content.toString()));
  });
}

export interface IPlotReportData {
  // data required for SS
  plotLayerpath: string,
  plotIdx: number,
  blockLayerpath: string,
  blockIdx: number,
  rasterLayerpath: string,
  plotLayerFilepath: string;

  // data generated after SS
  plotImageBuffer?: Buffer;
  blockImageBuffer?: Buffer;
  coverImageBuffer?: Buffer;
  frontViewImageBuffer?: Buffer;

  // all other data

  blockName?: string;
  date: string;
  users: string[];

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

export type AruMetadata = {
  mission_id: string;
  user_id: string;
  tenant_id: string;
  filename: string;
};

export type PlotReportRequest = IPlotReportData & { metadata: AruMetadata; };

export type PlotReportResponse = {
  size: number;
  success: boolean;
  metadata: AruMetadata;
  error?: string;
};

export const generatePlotReport = async (req: PlotReportRequest) => {
  await Document.findOneAndDelete({
    tenantId: req.metadata.tenant_id,
    missionId: req.metadata.mission_id,
    name: req.metadata.filename,
  });
  ReportEvents.emit(REQ_QUEUE, req);
  logger.info(req, "SENT REPORT GENERATION REQUEST");
};

export const receiveReport = async (res: PlotReportResponse) => {
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
    const savedDoc = await docDB.save();

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

ReportEvents.on(RES_QUEUE, function(res: PlotReportResponse) {
  logger.info(res, "RECEIVED REPORT GENERATION RESPONSE");
  receiveReport(res)
    .then(() => logger.info(res, "GENERATED REPORT"))
    .catch((err) => logger.error({ res, err }, "FAILED TO GENERATE REPORT"));
});

export interface IDeliverable {
  imageHeading: string;
  imageBuffer: Buffer;
}

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
