import { Document } from "docx";
import { page1 } from "./reportPg1";
import { page2 } from "./reportPg2";
// import { page3 } from "./reportPg3";
import { numberings } from "./reportUtils";
// import { reportMapPage } from "./reportMapPage";
// import { reportPg7 } from "./reportPg7";
import { IData } from "./types";

export const generateDocument = (data: IData): Document => {
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
        occupancy
    } = data;
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
                missionMapImgPath,
                missionCode,
                date,
                users, 
                emails, 
                phoneNos
            }),
            page2({ 
                missionHeading, 
                missionSubHeading,
                missionMapImgPath,
                missionCode,
                area,
                occupancy,
            }),
            // page3({
            //     missionCode: "FSIPL/NKDA/R/003",
            //     roadData: [
            //         { name: "No of roads", value: "23" },
            //         { name: "Road's Length", value: "3913.31 mt.(Approx)" },
            //         { 
            //             name: "Roads are sharing with adjacent blocks", 
            //             value: [
            //                 { name: "Adjacent Block", value: "AF,AD,AG,AA" },
            //                 { name: "Street no. of roads", value: "32,39,41,51,64" },
            //                 { name: "Road Segment Length", value: "1633.50 mt.(Approx)" },
            //                 { 
            //                     name: "Street no. sharing with adjacent block", 
            //                     value: [
            //                         { name: "", value: "51 with AA Block" },
            //                         { name: "", value: "64 with AD & AG Block" },
            //                         { name: "", value: "39, 41 & 42 with AF Block" },
            //                     ],
            //                 },
            //             ],
            //         },
            //         { name: "Major Road Problem", value: "NA" },
            //     ],
            //     footpathData: [
            //         { name: "Street with footpath", value: "32, 47, 51, 64, 41" },
            //         { name: "Street with partial footpath", value: "39" },
            //         { name: "Street without footpath", value: "34, 36, 38, 40, 42, 43, 44, 46, 48, 49, 50, 52, 54, 56, 58, 60, 62" },
            //     ],
            //     greeneryData: [
            //         { name: "Area", value: "14430.05 sq. mt." },
            //         { name: "No. of trees", value: "197" },
            //         { 
            //             name: "Green Verges and Public Parks", 
            //             value: [
            //                 { name: "", value: "AC Block Park" },
            //                 { name: "", value: "NKDA Park" },
            //                 { name: "", value: "NKDA Sensory Park" },
            //             ],
            //         },
            //     ],
            //     canalData: [
            //         { name: "\"C\" Canal", value: "338.86 mt." },
            //     ],
            //     waterBodyData: [
            //         { name: "Perimeter", value: "99.79 mt." },
            //         { name: "Area", value: "701.82 sq. mt." },
            //         { name: "Clean", value: "Not Verified" },
            //         { name: "Swimmable", value: "Not Verified" },
            //     ],
            //     wasteBinData: "NA",
            //     constructionSitesData: "23 Nos",
            //     cycleTrackData: [
            //         { name: "Cycle Track Length", value: "1800.17 mt. (Approx)" },
            //         { name: "Street no. with cycle track", value: "64, 41" },
            //         { name: "Major Problem", value: "NA" },
            //         { name: "Cycle route", value: "No" },
            //     ],
            //     streetLightData: "100",
            //     parkingData: "00",
            //     publicMarketData: "00",
            //     stubbleBurningData: "NA",
            //     policeAndFireStationsData: "00",
            //     waterAndDrainageNetworkData: [
            //         { name: "No. of water tanks", value: "01" },
            //         { name: "Water tanks list", value: [
            //             { name: "", value: "Water Tank 01" },
            //         ] },
            //         { name: "Water logging", value: "NA" },
            //         { name: "Water Harvesting Pit", value: "NA" },
            //     ],
            //     publicArtData: "NA",
            //     publicGymData: "NA",
            //     rooftopSolarData: "NA",
            //     othersData: [
            //         { name: "Neighbourhood Center", value: "001" },
            //     ],
            // }),
            // reportMapPage({
            //     heading: "ACTION AREA - I", 
            //     subheading: "BLOCK: 'AC' PLOT DETAILS - PART 01", 
            //     imgPath: "./images/page6Image.jpg",
            // }),
            // reportPg7({
            //     heading: "ACTION AREA - I", 
            //     subheading: "BLOCK: 'AC' PLOT DETAILS - PART 02", 
            //     imgPaths: [
            //         "./images/page7_BarChart.png",
            //         "./images/page7_PieChart1.png",
            //         "./images/page7_PieChart2.png",
            //     ],
            // }),
            // ...([
            //         { deliverable: "OVERVIEW", imgPath: "./images/page4Image.jpg" },
            //         { deliverable: "BOUNDARY", imgPath: "./images/page5Image.jpg" },
            //         { deliverable: "BUILT-UP AREA", imgPath: "./images/page8Image.png" },
            //         { deliverable: "AMENITIES AND POI", imgPath: "./images/page9Image.jpg" },
            //         { deliverable: "OTHER FEATURES", imgPath: "./images/page10Image.jpg" },
            //         { deliverable: "ACTIONABLE POINTS", imgPath: "./images/page11Image.jpg" },
            //         { deliverable: "OCCUPIED UNTAXED AREA (ENCROACHMENT)", imgPath: "./images/page12Image.jpg" },
            //         { deliverable: "ROAD DETAILS", imgPath: "./images/page13Image.jpg" },
            //         { deliverable: "FOOTPATH DETAILS", imgPath: "./images/page14Image.jpg" },
            //         { deliverable: "CYCLE TRACK DETAILS", imgPath: "./images/page15Image.jpg" },
            //         { deliverable: "WATERBODIES DETAILS", imgPath: "./images/page16Image.png" },
            //         { deliverable: "GREENERY DETAILS", imgPath: "./images/page16Image.png" },
            //         { deliverable: "WATERBODIES DETAILS", imgPath: "./images/page17Image.png" },
            //         { deliverable: "WATER TANK", imgPath: "./images/page18Image.png" },
            //         { deliverable: "STREET-LIGHT DETAILS", imgPath: "./images/page19Image.jpg" },
            //     ].map((d) => {
            //         return reportMapPage({
            //             heading: "ACTION AREA - I", 
            //             subheading: `BLOCK: 'AC' ${d.deliverable}`, 
            //             imgPath: d.imgPath,
            //         });
            // })),
        ]
    });
}
