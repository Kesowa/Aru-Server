export interface IDeliverable {
  imageHeading: string;
  imageBuffer: Buffer;
}

export interface IPlotReportData {
  // page 1
  blockName?: string; // provided
  date: string; // generated
  users: string[]; // generated
  coverImageBuffer?: Buffer; // generated

  // page 2
  blockImageBuffer?: Buffer; // generated
  plotImageBuffer?: Buffer; // generated
  frontViewImageBuffer?: Buffer; // generated

  // page 3

  // plot details
  plotArea?: string; // generated
  plotNo?: string; // provided
  premiseNo?: string; // provided
  pincode?: string; // provided
  category?: string; // provided
  infraction?: string; // provided
  isGreenTopEligible?: string; // provided
  isSolarPlantEligible?: string; // provided
  hasTradeLicense?: string; // provided
  tax?: string; // provided

  // building details
  buildingArea?: string; // generated
  buildingFootprint?: string; // generated, (building area / plot area) * 100% ??
  buildingAvailable?: string; // provided
  floorCount?: string; // provided
  buildingNo?: string; // provided
  hasCompletionCertificate?: string; // provided
  buildingHeight?: string; // provided

  // block details
  blockArea?: string; // generated
  greeneryArea?: string; // generated
  canopyArea?: string; // generated
  waterbodyArea?: string; // generated
  greeneryPercent?: string; // generated
  canopyPercent?: string; // generated
  waterbodyPercent?: string; // generated
  garbageCollectionInfo?: string; // provided
  averageBuildingHeight?: string; // provided
  averageBlockHeight?: string; // provided
  averageIncentives?: string; // provided
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
