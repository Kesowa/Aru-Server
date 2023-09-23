import { Table, BorderStyle, TableRow, HeightRule, TableCell, ShadingType, Paragraph, AlignmentType, TextRun, VerticalAlign, FrameAnchorType } from "docx";
import { commonPageFooter, commonPageProperties } from "./reportUtils";

const pg3Heading = new Paragraph({
    frame: {
        position: {
            x: 5250,
            y: 0,
        },
        width: 3000,
        height: 400,
        anchor: {
            horizontal: FrameAnchorType.MARGIN,
            vertical: FrameAnchorType.MARGIN,
        },
    },
    children: [
        new TextRun({
            text: "Block Specific Insights",
            size: "14pt",
            font: "Calibri",
            bold: true,
            allCaps: true,
        })
    ]
});

const renderTableCellFromData = (data: any, numberingRef: string, currLevel: number): Paragraph[] => {
    if(Array.isArray(data)) { // for data which needs numbering
        let components: Paragraph[] = [];
        for(const d of data) {
            if(typeof d.value === "string") { // base condition, no further need for numbering
                components.push(
                    new Paragraph({
                        text: (d.name !== "") ? `${d.name}: ${d.value}` : `${d.value}`,
                        numbering: {
                            reference: numberingRef,
                            level: currLevel,
                        }
                    }),
                );
            } else if(Array.isArray(d.value)) { // more sub-levels of numbering required
                components.push(
                    new Paragraph({
                        text: `${d.name}:`,
                        numbering: {
                            reference: numberingRef,
                            level: currLevel,
                        }
                    }),
                );
                const subComponents = renderTableCellFromData(d.value, numberingRef, currLevel + 1);
                components = components.concat(subComponents);
            }
        }
        return components;
    } else if(typeof data === "string") { // for data which doesn't need numbering
        return [
            new Paragraph({
                text: data,
                alignment: AlignmentType.CENTER,
            }),
        ];
    } else {
        // for invalid type of data
        return [];
    }
}

const pg3Table1 = (table1Data: Array<any>) => {
    const headings = ["Roads", "Footpaths", "Greenery", "Canals"];
    return new Table({
        width: {
            size: "24.92cm",
        },
        float: {
            absoluteHorizontalPosition: "0cm",
            absoluteVerticalPosition: "1.25cm"
        },
        borders: {
            top: { style: BorderStyle.NONE, size: 0 },
            bottom: { style: BorderStyle.NONE, size: 0 },
            left: { style: BorderStyle.NONE, size: 0 },
            right: { style: BorderStyle.NONE, size: 0 },
        },
        rows: [
            new TableRow({
                height: {
                    value: "0.75cm",
                    rule: HeightRule.EXACT
                },
                children: headings.map((heading, idx) => {
                    return new TableCell({
                        width: {
                            size: "25%",
                        },
                        shading: {
                            color: "384454",
                            type: ShadingType.SOLID,
                        },
                        children: [
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                children: [
                                    new TextRun({
                                        text: heading,
                                        bold: true,
                                        color: "FFFFFF",
                                        size: "12pt",
                                        font: "Calibri"
                                    })
                                ]
                            }),
                        ],
                        borders: {
                            bottom: {
                                style: BorderStyle.THICK,
                                color: "FFFFFF",
                                size: 20,
                            },
                            right: {
                                style: BorderStyle.THICK,
                                color: "FFFFFF",
                                size: (idx < (headings.length - 1)) ? 20 : 0,
                            }
                        },
                        verticalAlign: VerticalAlign.CENTER,
                    });
                }),
            }),
            new TableRow({
                height: {
                    value: "6.5cm",
                    rule: HeightRule.EXACT
                },
                children: table1Data.map((data, idx) => {
                    return new TableCell({
                        margins:{
                            top: 100,
                        },
                        width: {
                            size: "25%",
                        },
                        shading: {
                            color: "8FAADC",
                            type: ShadingType.SOLID,
                        },
                        children: renderTableCellFromData(data, `pg3-table1-column${idx + 1}`, 0),
                        borders: {
                            right: {
                                style: BorderStyle.THICK,
                                color: "FFFFFF",
                                size: (idx < (table1Data.length - 1)) ? 20 : 0,
                            }
                        },
                    });
                }),
            })
        ]
    });
}

const pg3Table2 = (table2Data: Array<any>) => {
    const headings = ["Water Bodies", "Waste Bin", "Major Construction Sites", "Cycle Track"];
    return new Table({
        width: {
            size: "24.92cm",
        },
        float: {
            absoluteHorizontalPosition: "0cm",
            absoluteVerticalPosition: "9cm"
        },
        borders: {
            top: { style: BorderStyle.NONE, size: 0 },
            bottom: { style: BorderStyle.NONE, size: 0 },
            left: { style: BorderStyle.NONE, size: 0 },
            right: { style: BorderStyle.NONE, size: 0 },
        },
        rows: [
            new TableRow({
                height: {
                    value: "0.75cm",
                    rule: HeightRule.EXACT
                },
                children: headings.map((heading, idx) => {
                    return new TableCell({
                        width: {
                            size: "25%",
                        },
                        shading: {
                            color: "384454",
                            type: ShadingType.SOLID,
                        },
                        children: [
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                children: [
                                    new TextRun({
                                        text: heading,
                                        bold: true,
                                        color: "FFFFFF",
                                        size: "12pt",
                                        font: "Calibri"
                                    })
                                ]
                            }),
                        ],
                        borders: {
                            bottom: {
                                style: BorderStyle.THICK,
                                color: "FFFFFF",
                                size: 20,
                            },
                            right: {
                                style: BorderStyle.THICK,
                                color: "FFFFFF",
                                size: (idx < (headings.length - 1)) ? 20 : 0,
                            }
                        },
                        verticalAlign: VerticalAlign.CENTER,
                    });
                }),
            }),
            new TableRow({
                height: {
                    value: "2.5cm",
                    rule: HeightRule.EXACT
                },
                children: table2Data.map((data, idx) => {
                    return new TableCell({
                        margins:{
                            top: 150,
                        },
                        width: {
                            size: "25%",
                        },
                        shading: {
                            color: "EAD1C0",
                            type: ShadingType.SOLID,
                        },
                        children: renderTableCellFromData(data, `pg3-table2-column${idx + 1}`, 0),
                        borders: {
                            right: {
                                style: BorderStyle.THICK,
                                color: "FFFFFF",
                                size: (idx < (table2Data.length - 1)) ? 20 : 0,
                            }
                        },
                    });
                }),
            })
        ]
    });
};

const pg3Table3 = (
    streetLightData:any, 
    parkingData:any, 
    publicMarketData:any, 
    stubbleBurningData:any, 
    policeAndFireStationsData:any, 
    waterAndDrainageNetworkData:any,
    publicArtData:any,
    publicGymData:any,
    rooftopSolarData:any,
    othersData:any,
) => {
    const row1Heading = [
        { name: "Street Lights", sizePercent: 18, colSpan: 2 },
        { name: "Parking", sizePercent: 18, colSpan: 2 },
        { name: "Public Market", sizePercent: 18, colSpan: 2 },
        { name: "Stubble Burning", sizePercent: 18, colSpan: 2 },
        { name: "Others", sizePercent: 28, colSpan: 1 },
    ];
    const row3Heading = [
        { name: "Police Stations/ Fire Stations", sizePercent: 27, colSpan: 3 },
        { name: "Water & Drainage Network", sizePercent: 27, colSpan: 3 },
        { name: "Public Art", sizePercent: 18, colSpan: 2 },
    ];
    return new Table({
        width: {
            size: "24.92cm",
        },
        float: {
            absoluteHorizontalPosition: "0cm",
            absoluteVerticalPosition: "12.75cm"
        },
        borders: {
            top: { style: BorderStyle.NONE, size: 0 },
            bottom: { style: BorderStyle.NONE, size: 0 },
            left: { style: BorderStyle.NONE, size: 0 },
            right: { style: BorderStyle.NONE, size: 0 },
        },
        rows: [
            new TableRow({
                height: {
                    value: "0.75cm",
                    rule: HeightRule.EXACT
                },
                children: row1Heading.map((data, idx) => {
                    return new TableCell({
                        width: {
                            size: `${data.sizePercent}%`,
                        },
                        columnSpan: data.colSpan,
                        shading: {
                            color: "384454",
                            type: ShadingType.SOLID,
                        },
                        children: [
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                children: [
                                    new TextRun({
                                        text: data.name,
                                        bold: true,
                                        color: "FFFFFF",
                                        size: "12pt",
                                        font: "Calibri"
                                    })
                                ]
                            }),
                        ],
                        borders: {
                            right: {
                                style: BorderStyle.THICK,
                                color: "D9D9D9",
                                size: (idx < (row1Heading.length - 1)) ? 50 : 0,
                            },
                        },
                        verticalAlign: VerticalAlign.CENTER,
                    });
                }),
            }),
            new TableRow({
                height: {
                    value: "0.75cm",
                    rule: HeightRule.EXACT
                },
                children: [
                    ...([
                            {
                                data: streetLightData,
                                colSpan: 2,
                                rowSpan: 1,
                                size: 18,
                                borderSize: 50,
                                numRef: "",
                            }, 
                            {
                                data: parkingData,
                                colSpan: 2,
                                rowSpan: 1,
                                size: 18,
                                borderSize: 50,
                                numRef: "",
                            }, 
                            {
                                data: publicMarketData,
                                colSpan: 2,
                                rowSpan: 1,
                                size: 18,
                                borderSize: 50,
                                numRef: "",
                            }, 
                            {
                                data: stubbleBurningData,
                                colSpan: 2,
                                rowSpan: 1,
                                size: 18,
                                borderSize: 50,
                                numRef: "",
                            }, 
                            {
                                data: othersData,
                                colSpan: 1,
                                rowSpan: 5,
                                size: 28,
                                borderSize: 0,
                                numRef: "pg3-table3-others",
                            }, 
                        ].map((d) => {
                        return new TableCell({
                            width: {
                                size: `${d.size}%`,
                            },
                            columnSpan: d.colSpan,
                            rowSpan: d.rowSpan,
                            shading: {
                                color: "EEE6D1",
                                type: ShadingType.SOLID,
                            },
                            children: renderTableCellFromData(d.data, d.numRef, 0),
                            borders: {
                                bottom: {
                                    style: BorderStyle.THICK,
                                    color: "D9D9D9",
                                    size: d.borderSize,
                                },
                                right: {
                                    style: BorderStyle.THICK,
                                    color: "D9D9D9",
                                    size: d.borderSize,
                                },
                            },
                            verticalAlign: VerticalAlign.CENTER,
                        });
                    })),
                ],
            }),
            new TableRow({
                height: {
                    value: "0.75cm",
                    rule: HeightRule.EXACT
                },
                children: row3Heading.map((data) => {
                    return new TableCell({
                        width: {
                            size: `${data.sizePercent}%`,
                        },
                        columnSpan: data.colSpan,
                        shading: {
                            color: "384454",
                            type: ShadingType.SOLID,
                        },
                        children: [
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                children: [
                                    new TextRun({
                                        text: data.name,
                                        bold: true,
                                        color: "FFFFFF",
                                        size: "12pt",
                                        font: "Calibri"
                                    })
                                ]
                            }),
                        ],
                        borders: {
                            right: {
                                style: BorderStyle.THICK,
                                color: "D9D9D9",
                                size: 50,
                            },
                        },
                        verticalAlign: VerticalAlign.CENTER,
                    });
                }),
            }),
            new TableRow({
                height: {
                    value: "0.75cm",
                    rule: HeightRule.EXACT
                },
                children: [
                    ...([
                            {
                                data: policeAndFireStationsData,
                                colSpan: 3,
                                rowSpan: 1,
                                size: 27,
                                borderSize: 50,
                                numRef: "",
                            }, 
                            {
                                data: waterAndDrainageNetworkData,
                                colSpan: 3,
                                rowSpan: 3,
                                size: 27,
                                borderSize: 50,
                                numRef: "pg3-table3-waterDrainage",
                            }, 
                            {
                                data: publicArtData,
                                colSpan: 2,
                                rowSpan: 1,
                                size: 18,
                                borderSize: 50,
                                numRef: "",
                            }, 
                        ].map((d) => {
                            return new TableCell({
                                width: {
                                    size: `${d.size}%`,
                                },
                                columnSpan: d.colSpan,
                                rowSpan: d.rowSpan,
                                shading: {
                                    color: "EEE6D1",
                                    type: ShadingType.SOLID,
                                },
                                children: renderTableCellFromData(d.data, d.numRef, 0),
                                borders: {
                                    bottom: {
                                        style: BorderStyle.THICK,
                                        color: "D9D9D9",
                                        size: d.borderSize,
                                    },
                                    right: {
                                        style: BorderStyle.THICK,
                                        color: "D9D9D9",
                                        size: d.borderSize,
                                    },
                                },
                                verticalAlign: VerticalAlign.CENTER,
                            });
                    })),
                ],
            }),
            new TableRow({
                height: {
                    value: "0.75cm",
                    rule: HeightRule.EXACT
                },
                children: [
                    ...([
                            { name: "Rooftop Solar", sizePercent: 27, colSpan: 3 },
                            { name: "Public Gym", sizePercent: 18, colSpan: 2 },
                        ].map((d) => {
                            return new TableCell({
                                width: {
                                    size: `${d.sizePercent}%`,
                                },
                                columnSpan: d.colSpan,
                                shading: {
                                    color: "384454",
                                    type: ShadingType.SOLID,
                                },
                                children: [
                                    new Paragraph({
                                        alignment: AlignmentType.CENTER,
                                        children: [
                                            new TextRun({
                                                text: d.name,
                                                bold: true,
                                                color: "FFFFFF",
                                                size: "12pt",
                                                font: "Calibri"
                                            })
                                        ]
                                    }),
                                ],
                                borders: {
                                    right: {
                                        style: BorderStyle.THICK,
                                        color: "D9D9D9",
                                        size: 50,
                                    },
                                },
                                verticalAlign: VerticalAlign.CENTER,
                            });
                    })),
                ],
            }),
            new TableRow({
                height: {
                    value: "0.75cm",
                    rule: HeightRule.EXACT
                },
                children: [
                    ...([
                            {
                                data: rooftopSolarData,
                                sizePercent: 27,
                                colSpan: 3,
                            },
                            {
                                data: publicGymData,
                                sizePercent: 18,
                                colSpan: 2,
                            },
                        ].map((d) => {
                            return new TableCell({
                                width: {
                                    size: `${d.sizePercent}%`,
                                },
                                columnSpan: d.colSpan,
                                shading: {
                                    color: "EEE6D1",
                                    type: ShadingType.SOLID,
                                },
                                children: renderTableCellFromData(d.data, "", 0),
                                borders: {
                                    bottom: {
                                        style: BorderStyle.THICK,
                                        color: "D9D9D9",
                                        size: 50,
                                    },
                                    right: {
                                        style: BorderStyle.THICK,
                                        color: "D9D9D9",
                                        size: 50,
                                    },
                                },
                                verticalAlign: VerticalAlign.CENTER,
                            });
                    }))
                ]
            }),
        ],
    });
};

const idTextBox = (missionCode:string) => {
    return new Paragraph({
        frame: {
            position: {
                x: 12100,
                y: 0,
            },
            width: 2000,
            height: 200,
            anchor: {
                horizontal: FrameAnchorType.MARGIN,
                vertical: FrameAnchorType.MARGIN,
            },
        },
        children: [
            new TextRun({
                text: missionCode,
                color: "7E7E7E",
                size: "10pt",
                font: {
                    name: "Arial MT",
                },
            }),
        ],
    });
}

export const page3 = (properties: any) => {
    const { 
        missionCode, 
        roadData, 
        footpathData, 
        greeneryData, 
        canalData, 
        waterBodyData,
        wasteBinData,
        constructionSitesData,
        cycleTrackData,
        streetLightData,
        parkingData,
        publicMarketData,
        stubbleBurningData,
        policeAndFireStationsData,
        waterAndDrainageNetworkData,
        publicArtData,
        publicGymData,
        rooftopSolarData,
        othersData,
    } = properties;

    const table1Data = [ roadData, footpathData, greeneryData, canalData ];
    const table2Data = [ waterBodyData, wasteBinData, constructionSitesData, cycleTrackData ];

    return {
        properties: commonPageProperties,
        footers: commonPageFooter,
        children: [
            pg3Heading,
            pg3Table1(table1Data),
            pg3Table2(table2Data),
            pg3Table3(
                streetLightData, 
                parkingData, 
                publicMarketData, 
                stubbleBurningData, 
                policeAndFireStationsData, 
                waterAndDrainageNetworkData,
                publicArtData,
                publicGymData,
                rooftopSolarData,
                othersData,
            ),
            idTextBox(missionCode)
        ],
    };
};
