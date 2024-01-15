export interface IDeliverable {
  imageHeading: string,
  imageBuffer: Buffer,
}

export interface IPlotReportData {
  // page 1
  blockName?: string; // provided
  date: string; // generated
  users: string[]; // generated
  coverImageBuffer?: Buffer; // generated

  // page 2
  blockImageBuffer?: Buffer, // generated
  plotImageBuffer?: Buffer, // generated
  frontViewImageBuffer?: Buffer, // generated

  // page 3

  // plot details
  plotArea?: number, // generated
  plotNo?: string, // provided
  premiseNo?: string, // provided
  pincode?: string, // provided
  category?: string, // provided
  infraction?: string, // provided
  isGreenTopEligible?: string, // provided
  isSolarPlantEligible?: string, // provided
  hasTradeLicense?: string, // provided
  tax?: string, // provided

  // building details
  buildingArea?: number, // generated
  buildingFootprint?: number, // generated, (building area / plot area) * 100% ??
  buildingAvailable?: string, // provided
  floorCount?: string, // provided
  buildingNo?: string, // provided
  hasCompletionCertificate?: string, // provided
  buildingHeight?: string, // provided

  // block details
  blockArea?: number, // generated
  greeneryArea?: number, // generated
  canopyArea?: number, // generated
  waterbodyArea?: number, // generated
  greeneryPercent?: number, // generated
  canopyPercent?: number, // generated
  waterbodyPercent?: number, // generated
  garbageCollectionInfo?: string, // provided
  averageBuildingHeight?: string, // provided
  averageBlockHeight?: string, // provided
  averageIncentives?: string, // provided
}

export interface IPage1Properties {
  blockName: string;
  coverImageBuffer: Buffer;
  date: string;
  users: string[];
}

export interface IPage3Properties {
  // plot details
  plotArea: number, // generated
  plotNo: string, // provided
  premiseNo: string, // provided
  pincode: string, // provided
  category: string, // provided
  infraction: string, // provided
  isGreenTopEligible: string, // provided
  isSolarPlantEligible: string, // provided
  hasTradeLicense: string, // provided
  tax: string, // provided

  // building details
  buildingArea: number, // generated
  buildingFootprint: number, // generated, (building area / plot area) * 100% ??
  buildingAvailable: string, // provided
  floorCount: string, // provided
  buildingNo: string, // provided
  hasCompletionCertificate: string, // provided
  buildingHeight: string, // provided

  // block details
  greeneryPercent: number, // generated
  canopyPercent: number, // generated
  waterbodyPercent: number, // generated
  blockName: string, // provided
  garbageCollectionInfo: string, // provided
  averageBuildingHeight: string, // provided
  averageBlockHeight: string, // provided
  averageIncentives: string, // provided
}

export interface IPlotProperties {
  plotNo?: string,
  premiseNo?: string, // connects plot to buildings
  buildingAvailable?: string,
  pincode?: string,
  category?: string,
  shopFloor?: string, // no. of floor
  buildingStatus?: string, // completion certificate
  blockName?: string,
  
  // not present on test geojson
  sanctionedBuildingNo?: string,
  infraction?: string,
  isIncentiveEligible?: string,
  isGreenTopEligible?: string,
  isSolarPlantEligible?: string,
  hasTradeLicense?: string,
  tax?: string,
  garbageCollectionInfo?: string,
  averageBuildingHeight?: string,
  averageBlockHeight?: string,
  averageIncentives?: string
}

export interface IBuildingProperties {
  premiseNo: string, // connects building to plot
  buildingHeight?: string,
  sys_id: string,
}

export interface IBlockProperties {
  blockName: string,
  garbageCollectionInfo: string,
  averageBuildingHeight: string,
  averageBlockHeight: string,
  averageIncentives: string
}