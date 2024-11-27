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
      filePath: `/documents/${res.metadata.filename}.docx`,
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
