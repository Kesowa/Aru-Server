export interface IReportData {

};

export interface IPage1Properties {
    missionHeading: string, 
    missionSubHeading: string, 
    missionMapImgPath: string, 
    missionCode: string, 
    missionDate: string,
    users: string[], 
    emails: string[], 
    phoneNos: string[]
};

export interface IAreaDesc {
    name: string,
    value: number, // area in square metres
}
export interface IOccupancyDesc {
    name: string,
    occupied: number,
    underConstruction: number,
    vacant: number,
}
export interface IAreaData {
    total: number,
    privateSpaces: IAreaDesc[],
    publicSpaces: IAreaDesc[],
    other: number,
}
export interface IPage2Properties {
    missionHeading: string, 
    missionSubHeading: string, 
    missionMapImgPath: string, 
    missionCode: string, 
    area: IAreaData, 
    occupancy: IOccupancyDesc[],
}

export interface IReportMapPageProperties {
    heading: string,
    subheading: string,
    imgPath: string,
}

export interface IPage7Properties {
    heading: string,
    subheading: string,
    imgPaths: string[],
}