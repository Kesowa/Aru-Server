import { Document } from "docx";
import { page1 } from "./reportPg1";
import { page2 } from "./reportPg2";
import { page3 } from "./reportPg3";
import { numberings } from "./reportUtils";
import { reportMapPage } from "./reportMapPage";
import { page4 } from "./reportPg4";
import { IData } from "./types";
import { ScreenshotGenerator } from "./screenshot";
import { pino } from "pino";

export const generateDocument = async (data: IData, logger: pino.Logger) => {
    const { 
        missionHeading, 
        missionSubHeading, 
        missionMapImgPath, 
        missionCode, 
        date,
        users, 
        emails, 
        phoneNos,
        area, 
        occupancy,
        roadCount,
        roadLength,
        cycleTrackLength,
        deliverables,
    } = data;

    let residentialArea = data.area.privateSpaces.find((obj) => { return obj.name === "Residential"; }).value;
    let governmentArea = data.area.publicSpaces.find((obj) => { return obj.name === "Government"; }).value;
    let total = residentialArea + governmentArea;
    if(total !== 0) {
        residentialArea = residentialArea/total;
        governmentArea = governmentArea/total;
    }

    let totalOccupied = 0, totalUnderConstruction = 0, totalVacant = 0;
    for(const d of data.occupancy) {
        totalOccupied += d.occupied;
        totalUnderConstruction += d.underConstruction;
        totalVacant += d.vacant;
    }
    total = totalOccupied + totalUnderConstruction + totalVacant;
    if(total !== 0) {
        totalOccupied = totalOccupied/total;
        totalUnderConstruction = totalUnderConstruction/total;
        totalVacant = totalVacant/total;
    }

    const govtBarChartData = data.occupancy.find((obj) => { return obj.name === "Government"; })
    const residentialBarChartData = data.occupancy.find((obj) => { return obj.name === "Residential"; })

    // Take all necessary screenshots

    const ssGenerator = new ScreenshotGenerator(logger);
    await ssGenerator.init();

    logger.info("Browser Launched for screenshots...");

    const missionMapImg = await ssGenerator.getMapSS("https://cog-nk.kesowa.com", data.deliverables["OVERVIEW"]);

    logger.info("Mission Map Image Captured...");

    const categoryPieChart = await ssGenerator.getChartSS("Area Distribution By Plot Category", [
        {name: "Government", percent: governmentArea*100, color: "#4472c4"},
        {name: "Residential", percent: residentialArea*100, color: "#ed7d31"},
    ], ScreenshotGenerator.PIE_CHART);
    
    logger.info("Category Pie Chart Image Captured...");

    const statusPieChart = await ssGenerator.getChartSS("Area Distribution By Plot Status", [
        {name: "Under Construction", percent: totalUnderConstruction*100, color: "#ffc000"},
        {name: "Empty", percent: totalVacant*100, color: "#5b9bd5"},
        {name: "Constructed", percent: totalOccupied*100, color: "#70ad47"},
    ], ScreenshotGenerator.PIE_CHART);

    logger.info("Status Pie Chart Image Captured...");

    const barChart = await ssGenerator.getChartSS("Plot Details", [
        {
            name: "Government", 
            UnderConstruction: govtBarChartData.underConstruction, 
            Empty: govtBarChartData.vacant, 
            Constructed: govtBarChartData.occupied 
        },
        {
            name: "Residential", 
            UnderConstruction: residentialBarChartData.underConstruction, 
            Empty: residentialBarChartData.vacant, 
            Constructed: residentialBarChartData.occupied 
        },
    ], ScreenshotGenerator.BAR_CHART);

    logger.info("Bar Chart Image Captured...");

    const deliverableBuffers: any = {};
    for(const d in deliverables) {
        logger.info(`Capturing image for: ${d}...`)
        deliverableBuffers[d] = await ssGenerator.getMapSS("https://cog-nk.kesowa.com", deliverables[d]);
    }

    logger.info("All Images Captured... Generating document...");
    
    await ssGenerator.destroy();

    logger.info("Browser Closed...");

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
    return new Document({
        numbering: numberings,
        background: {
            color: "D9D9D9",
        },
        sections: [
            page1({ 
                missionHeading, 
                missionSubHeading,
                missionMapImg,
                missionCode,
                date,
                users, 
                emails, 
                phoneNos
            }),
            page2({ 
                missionHeading, 
                missionSubHeading,
                missionMapImg,
                missionCode,
                area,
                occupancy,
            }),
            page3({
                missionCode,
                roadData: [
                    { name: "No of roads", value: `${roadCount}` },
                    { name: "Road's Length", value: `${roadLength} mt.(Approx)` },
                    { 
                        name: "Roads are sharing with adjacent blocks:", 
                        value: [
                            { name: "Adjacent Block", value: "" },
                            { name: "Street no. of roads", value: "" },
                            { name: "Road Segment Length", value: "" },
                            { 
                                name: "Street no. sharing with adjacent block", 
                                value: "-",
                            },
                        ],
                    },
                    { name: "Major Road Problem", value: "-" },
                ],
                footpathData: [
                    { name: "Street with footpath", value: "-" },
                    { name: "Street with partial footpath", value: "-" },
                    { name: "Street without footpath", value: "-" },
                ],
                greeneryData: [
                    { name: "Area", value: `${area.publicSpaces[4].value} sq. mt.` },
                    { name: "No. of trees", value: "-" },
                    { 
                        name: "Green Verges and Public Parks", 
                        value: "-",
                    },
                ],
                canalData: "-",
                waterBodyData: [
                    { name: "Perimeter", value: "" },
                    { name: "Area", value: `${area.publicSpaces[5].value} sq. mt.` },
                    { name: "Clean", value: "-" },
                    { name: "Swimmable", value: "-" },
                ],
                wasteBinData: "-",
                constructionSitesData: "-",
                cycleTrackData: [
                    { name: "Cycle Track Length", value: `${cycleTrackLength} mt. (Approx)` },
                    { name: "Street no. with cycle track", value: "-" },
                    { name: "Major Problem", value: "-" },
                    { name: "Cycle route", value: "-" },
                ],
                streetLightData: "-",
                parkingData: "-",
                publicMarketData: "-",
                stubbleBurningData: "-",
                policeAndFireStationsData: "-",
                waterAndDrainageNetworkData: "-",
                publicArtData: "-",
                publicGymData: "-",
                rooftopSolarData: "-",
                othersData: "-",
            }),
            page4({
                heading: missionHeading, 
                subheading: "PLOT DETAILS", 
                categoryPieChart,
                statusPieChart,
                barChart,
                area,
                occupancy,
            }),
            ...Object.keys(deliverableBuffers).map((key) => {
                return reportMapPage({
                    heading: missionHeading,
                    subheading: key,
                    imgBuffer: deliverableBuffers[key],
                });
            }),
        ]
    });
}
