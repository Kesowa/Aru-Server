export interface IPage1Properties {
    missionHeading: string, 
    missionSubHeading: string, 
    missionMapImg: Buffer, 
    missionCode: string, 
    date: string,
    users: string[], 
    emails: string[], 
    phoneNos: string[]
}

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
    categoryPieChart: Buffer,
    statusPieChart: Buffer,
    barChart: Buffer,
}

export interface IDeliverable {
    name: string,
    imgPath: string,
}

export interface IData {
    missionHeading: string, 
    missionSubHeading: string, 
    missionMapImgPath: string, 
    missionCode: string, 
    date: string,
    users: string[], 
    emails: string[], 
    phoneNos: string[],
    // page 2
    area: IAreaData, 
    occupancy: IOccupancyDesc[],
    // page 3
    roadCount: number,
    roadLength: number,
    cycleTrackLength: number,
    // map pages
    deliverables: IDeliverable[],
}