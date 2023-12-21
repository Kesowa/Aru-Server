export interface IDeliverable {
  imageHeading: string,
  imageBuffer: Buffer,
}

export interface IPlotReportData {
  // page 1
  blockName: string; // provided
  date: string; // generated
  users: string[]; // generated
  coverImageBuffer?: Buffer; // generated

  // page 2
  blockImageBuffer?: Buffer, // generated
  plotImageBuffer?: Buffer, // generated
  frontViewImageBuffer?: Buffer, // generated

  // page 3

  // plot details
  plotArea: number, // generated
  plotNo: string, // provided
  premiseNo: string, // provided
  pincode: number, // provided
  category: string, // provided
  infraction: string, // provided
  isGreenTopEligible: boolean, // provided
  isSolarPlantEligible: boolean, // provided
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
  pincode: number, // provided
  category: string, // provided
  infraction: string, // provided
  isGreenTopEligible: boolean, // provided
  isSolarPlantEligible: boolean, // provided
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
  greeneryPercent: number, // generated
  canopyPercent: number, // generated
  waterbodyPercent: number, // generated
  garbageCollectionInfo: string, // provided
  averageBuildingHeight: number, // provided
  averageBlockHeight: number, // provided
  averageIncentives: number, // provided
}
