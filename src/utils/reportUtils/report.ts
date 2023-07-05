import { Document } from "docx";
import { page1 } from "./reportPg1";
import { page2 } from "./reportPg2";
import { page3 } from "./reportPg3";
import { numberings } from "./reportUtils";
import { reportMapPage } from "./reportMapPage";
import { reportPg7 } from "./reportPg7";
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
        occupancy,
        roadCount,
        roadLength,
        cycleTrackLength,
        deliverables,
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
            reportMapPage({
                heading: missionHeading, 
                subheading: "PLOT DETAILS - PART 01", 
                imgPath: "",
            }),
            reportPg7({
                heading: missionHeading, 
                subheading: "PLOT DETAILS - PART 02", 
                imgPaths: [],
            }),
            ...(deliverables.map((d) => {
                    return reportMapPage({
                        heading: missionHeading, 
                        subheading: `${d.name}`, 
                        imgPath: d.imgPath,
                    });
            })),
        ]
    });
}
