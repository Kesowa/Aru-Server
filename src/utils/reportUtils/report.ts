import { Document } from "docx";
import { page1 } from "./reportPg1";
import { page2 } from "./reportPg2";
import { page3 } from "./reportPg3";
import { numberings } from "./reportUtils";
import { reportMapPage } from "./reportMapPage";
import { reportPg7 } from "./reportPg7";
import { IData } from "./types";
import { ScreenshotGenerator } from "./screenshot";

export const generateDocument = async (data: IData) => {
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

    // Take all necessary screenshots

    const ssGenerator = new ScreenshotGenerator();
    await ssGenerator.init();
    const missionMapImg = await ssGenerator.getMapSS("https://cog-nk.kesowa.com", [
        "https://cdn-dev.kesowa.com/vector/00854a1e-568d-42db-84e9-a310df7593c9.geojson",
        "https://cdn-dev.kesowa.com/vector/59af3119-fd68-48d0-966a-9a0008ec2b18.geojson"
    ]);
    const categoryPieChart = await ssGenerator.getChartSS("Area Distribution By Plot Category", [
        {name: "Government", percent: 16, color: "#4472c4"},
        {name: "Residential", percent: 84, color: "#ed7d31"},
    ], ScreenshotGenerator.PIE_CHART);
    const statusPieChart = await ssGenerator.getChartSS("Area Distribution By Plot Status", [
        {name: "Under Construction", percent: 9, color: "#ffc000"},
        {name: "Empty", percent: 28, color: "#5b9bd5"},
        {name: "Constructed", percent: 63, color: "#70ad47"},
    ], ScreenshotGenerator.PIE_CHART);
    const barChart = await ssGenerator.getChartSS("Plot Details", [
        {name: "Government", UnderConstruction: 1, Empty: 7, Constructed: 3 },
        {name: "Residential", UnderConstruction: 22, Empty: 50, Constructed: 157 },
    ], ScreenshotGenerator.BAR_CHART);
    await ssGenerator.destroy();

    const pg1 = await page1({ 
        missionHeading, 
        missionSubHeading,
        missionMapImg,
        missionCode,
        date,
        users, 
        emails, 
        phoneNos
    });
    const pg7 = await reportPg7({
        heading: missionHeading, 
        subheading: "PLOT DETAILS - PART 02", 
        categoryPieChart,
        statusPieChart,
        barChart,
    });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
    return new Document({
        numbering: numberings,
        background: {
            color: "D9D9D9",
        },
        sections: [
            pg1,
            // page2({ 
            //     missionHeading, 
            //     missionSubHeading,
            //     missionMapImgPath,
            //     missionCode,
            //     area,
            //     occupancy,
            // }),
            // page3({
            //     missionCode,
            //     roadData: [
            //         { name: "No of roads", value: `${roadCount}` },
            //         { name: "Road's Length", value: `${roadLength} mt.(Approx)` },
            //         { 
            //             name: "Roads are sharing with adjacent blocks:", 
            //             value: [
            //                 { name: "Adjacent Block", value: "" },
            //                 { name: "Street no. of roads", value: "" },
            //                 { name: "Road Segment Length", value: "" },
            //                 { 
            //                     name: "Street no. sharing with adjacent block", 
            //                     value: "-",
            //                 },
            //             ],
            //         },
            //         { name: "Major Road Problem", value: "-" },
            //     ],
            //     footpathData: [
            //         { name: "Street with footpath", value: "-" },
            //         { name: "Street with partial footpath", value: "-" },
            //         { name: "Street without footpath", value: "-" },
            //     ],
            //     greeneryData: [
            //         { name: "Area", value: `${area.publicSpaces[4].value} sq. mt.` },
            //         { name: "No. of trees", value: "-" },
            //         { 
            //             name: "Green Verges and Public Parks", 
            //             value: "-",
            //         },
            //     ],
            //     canalData: "-",
            //     waterBodyData: [
            //         { name: "Perimeter", value: "" },
            //         { name: "Area", value: `${area.publicSpaces[5].value} sq. mt.` },
            //         { name: "Clean", value: "-" },
            //         { name: "Swimmable", value: "-" },
            //     ],
            //     wasteBinData: "-",
            //     constructionSitesData: "-",
            //     cycleTrackData: [
            //         { name: "Cycle Track Length", value: `${cycleTrackLength} mt. (Approx)` },
            //         { name: "Street no. with cycle track", value: "-" },
            //         { name: "Major Problem", value: "-" },
            //         { name: "Cycle route", value: "-" },
            //     ],
            //     streetLightData: "-",
            //     parkingData: "-",
            //     publicMarketData: "-",
            //     stubbleBurningData: "-",
            //     policeAndFireStationsData: "-",
            //     waterAndDrainageNetworkData: "-",
            //     publicArtData: "-",
            //     publicGymData: "-",
            //     rooftopSolarData: "-",
            //     othersData: "-",
            // }),
            // reportMapPage({
            //     heading: missionHeading, 
            //     subheading: "PLOT DETAILS - PART 01", 
            //     imgPath: "",
            // }),
            pg7,
            // ...(deliverables.map((d) => {
            //         return reportMapPage({
            //             heading: missionHeading, 
            //             subheading: `${d.name}`, 
            //             imgPath: d.imgPath,
            //         });
            // })),
        ]
    });
}
