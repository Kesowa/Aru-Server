import { Paragraph, FrameAnchorType, ShadingType, ImageRun, HorizontalPositionRelativeFrom, VerticalPositionRelativeFrom, AlignmentType, TextRun, Table, TableRow, HeightRule, TableCell, VerticalAlign } from "docx";
import * as fs from "fs";
import { commonPageProperties, commonPageFooter, genPieChart, genStackedBarChart } from "./reportUtils";
import { IPage7Properties } from "./types";
import path from "path";

export const reportPg7 = async (properties: IPage7Properties) => {
    const { heading, subheading } = properties;
    let { imgPaths } = properties;
    while(imgPaths.length < 3) {
        imgPaths.push(path.join(__dirname, "images", "fallback.png"));
    }

    const categoryData = [
        {name: "Government", percent: 16, color: "#4472c4"},
        {name: "Residential", percent: 84, color: "#ed7d31"},
    ];
    const statusData = [
        {name: "Under Construction", percent: 9, color: "#ffc000"},
        {name: "Empty", percent: 28, color: "#5b9bd5"},
        {name: "Constructed", percent: 63, color: "#70ad47"},
    ];
    const barChartData = [
        {name: "Government", underConstruction: 1, empty: 7, constructed: 3 },
        {name: "Residential", underConstruction: 22, empty: 50, constructed: 157 },
    ];

    const categoryPieChart = await genPieChart(categoryData);
    const statusPieChart = await genPieChart(statusData);
    // const categoryPieChart = await genPieChart(categoryData, "Area Distribution By Plot Category");
    // const statusPieChart = await genPieChart(statusData, "Area Distribution By Plot Status");
    const barChart = await genStackedBarChart(barChartData);

    const headings = new Paragraph({
        frame: {
            position: {
                x: 1000,
                y: 0,
            },
            width: 75000,
            height: 1000,
            anchor: {
                horizontal: FrameAnchorType.MARGIN,
                vertical: FrameAnchorType.MARGIN,
            },
        },
        alignment: AlignmentType.CENTER,
        children: [
            new TextRun({
                text: heading,
                size: "24pt",
                font: "Arial",
                color: "FFFFFF",
                bold: true,
            }),
            new TextRun({
                text: subheading,
                size: "24pt",
                font: "Arial",
                color: "FFFFFF",
                bold: true,
                break: 1,
            }),
        ]
    });

    const categoryPieChartHeading = new Paragraph({
        frame: {
            position: {
                x: 8200,
                y: 2000,
            },
            width: 4000,
            height: 500,
            anchor: {
                horizontal: FrameAnchorType.MARGIN,
                vertical: FrameAnchorType.MARGIN,
            },
        },
        alignment: AlignmentType.CENTER,
        children: [
            new TextRun({
                text: "Area Distribution By Plot Category",
                size: "14pt",
                font: "Calibri",
                color: "000000",
                bold: true,
            }),
        ]
    });

    const statusPieChartHeading = new Paragraph({
        frame: {
            position: {
                x: 8200,
                y: 6950,
            },
            width: 4000,
            height: 500,
            anchor: {
                horizontal: FrameAnchorType.MARGIN,
                vertical: FrameAnchorType.MARGIN,
            },
        },
        alignment: AlignmentType.CENTER,
        children: [
            new TextRun({
                text: "Area Distribution By Plot Status",
                size: "14pt",
                font: "Calibri",
                color: "000000",
                bold: true,
            }),
        ]
    });

    const barChartHeading = new Paragraph({
        frame: {
            position: {
                x: 1000,
                y: 2000,
            },
            width: 4000,
            height: 500,
            anchor: {
                horizontal: FrameAnchorType.MARGIN,
                vertical: FrameAnchorType.MARGIN,
            },
        },
        alignment: AlignmentType.CENTER,
        children: [
            new TextRun({
                text: "Plot Details",
                size: "14pt",
                font: "Calibri",
                color: "000000",
                bold: true,
            }),
        ]
    });

    const table1 = new Table({
        borders: {

        },
        width: {
            size: "9.5cm",
        },
        float: {
            absoluteHorizontalPosition: "0cm",
            absoluteVerticalPosition: "12.4cm"
        },
        rows: [
            new TableRow({
                height: {
                    value: "0.5cm",
                    rule: HeightRule.EXACT
                },
                children: [
                    new TableCell({
                        width: {
                            size: "33.33%",
                        },
                        shading: {
                            type: ShadingType.SOLID,
                            color: "D9E1F2"
                        },
                        children: [
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: "Plot Category",
                                        bold: true,
                                    })
                                ]
                            }),
                        ],
                        verticalAlign: VerticalAlign.CENTER,
                    }),
                    new TableCell({
                        width: {
                            size: "33.33%",
                        },
                        shading: {
                            type: ShadingType.SOLID,
                            color: "D9E1F2"
                        },
                        children: [
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: "Plot Area In Sq. Mt.",
                                        bold: true,
                                    })
                                ]
                            }),
                        ],
                        verticalAlign: VerticalAlign.CENTER,
                    }),
                    new TableCell({
                        width: {
                            size: "33.33%",
                        },
                        shading: {
                            type: ShadingType.SOLID,
                            color: "D9E1F2"
                        },
                        children: [
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: "No. of Plots",
                                        bold: true,
                                    })
                                ]
                            }),
                        ],
                        verticalAlign: VerticalAlign.CENTER,
                    }),
                ]
            }),
            new TableRow({
                height: {
                    value: "0.5cm",
                    rule: HeightRule.EXACT
                },
                children: [
                    new TableCell({
                        width: {
                            size: "33.33%",
                        },
                        shading: {
                            type: ShadingType.SOLID,
                            color: "FFFFFF"
                        },
                        children: [
                            new Paragraph("Government"),
                        ],
                        verticalAlign: VerticalAlign.CENTER,
                    }),
                    new TableCell({
                        width: {
                            size: "33.33%",
                        },
                        shading: {
                            type: ShadingType.SOLID,
                            color: "FFFFFF"
                        },
                        children: [
                            new Paragraph("14259.071"),
                        ],
                        verticalAlign: VerticalAlign.CENTER,
                    }),
                    new TableCell({
                        width: {
                            size: "33.33%",
                        },
                        shading: {
                            type: ShadingType.SOLID,
                            color: "FFFFFF"
                        },
                        children: [
                            new Paragraph("11"),
                        ],
                        verticalAlign: VerticalAlign.CENTER,
                    }),
                ]
            }),
            new TableRow({
                height: {
                    value: "0.5cm",
                    rule: HeightRule.EXACT
                },
                children: [
                    new TableCell({
                        width: {
                            size: "33.33%",
                        },
                        shading: {
                            type: ShadingType.SOLID,
                            color: "FFFFFF"
                        },
                        children: [
                            new Paragraph("Residential"),
                        ],
                        verticalAlign: VerticalAlign.CENTER,
                    }),
                    new TableCell({
                        width: {
                            size: "33.33%",
                        },
                        shading: {
                            type: ShadingType.SOLID,
                            color: "FFFFFF"
                        },
                        children: [
                            new Paragraph("76473.782"),
                        ],
                        verticalAlign: VerticalAlign.CENTER,
                    }),
                    new TableCell({
                        width: {
                            size: "33.33%",
                        },
                        shading: {
                            type: ShadingType.SOLID,
                            color: "FFFFFF"
                        },
                        children: [
                            new Paragraph("229"),
                        ],
                        verticalAlign: VerticalAlign.CENTER,
                    }),
                ]
            }),
            new TableRow({
                height: {
                    value: "0.5cm",
                    rule: HeightRule.EXACT
                },
                children: [
                    new TableCell({
                        width: {
                            size: "33.33%",
                        },
                        shading: {
                            type: ShadingType.SOLID,
                            color: "D9E1F2"
                        },
                        children: [
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: "Grand Total",
                                        bold: true,
                                    })
                                ]
                            }),
                        ],
                        verticalAlign: VerticalAlign.CENTER,
                    }),
                    new TableCell({
                        width: {
                            size: "33.33%",
                        },
                        shading: {
                            type: ShadingType.SOLID,
                            color: "D9E1F2"
                        },
                        children: [
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: "90732.853",
                                        bold: true,
                                    })
                                ]
                            }),
                        ],
                        verticalAlign: VerticalAlign.CENTER,
                    }),
                    new TableCell({
                        width: {
                            size: "33.33%",
                        },
                        shading: {
                            type: ShadingType.SOLID,
                            color: "D9E1F2"
                        },
                        children: [
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: "229",
                                        bold: true,
                                    })
                                ]
                            }),
                        ],
                        verticalAlign: VerticalAlign.CENTER,
                    }),
                ]
            })
        ]
    });

    const table2 = new Table({
        width: {
            size: "9.5cm",
        },
        float: {
            absoluteHorizontalPosition: "0cm",
            absoluteVerticalPosition: "14.75cm"
        },
        rows: [
            new TableRow({
                height: {
                    value: "0.5cm",
                    rule: HeightRule.EXACT
                },
                children: [
                    new TableCell({
                        width: {
                            size: "33.33%",
                        },
                        shading: {
                            type: ShadingType.SOLID,
                            color: "D9E1F2"
                        },
                        children: [
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: "Building Status",
                                        bold: true,
                                    })
                                ]
                            }),
                        ],
                        verticalAlign: VerticalAlign.CENTER,
                    }),
                    new TableCell({
                        width: {
                            size: "33.33%",
                        },
                        shading: {
                            type: ShadingType.SOLID,
                            color: "D9E1F2"
                        },
                        children: [
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: "Plot Area In Sq. Mt.",
                                        bold: true,
                                    })
                                ]
                            }),
                        ],
                        verticalAlign: VerticalAlign.CENTER,
                    }),
                    new TableCell({
                        width: {
                            size: "33.33%",
                        },
                        shading: {
                            type: ShadingType.SOLID,
                            color: "D9E1F2"
                        },
                        children: [
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: "No. of Plots",
                                        bold: true,
                                    })
                                ]
                            }),
                        ],
                        verticalAlign: VerticalAlign.CENTER,
                    }),
                ]
            }),
            new TableRow({
                height: {
                    value: "0.5cm",
                    rule: HeightRule.EXACT
                },
                children: [
                    new TableCell({
                        width: {
                            size: "33.33%",
                        },
                        shading: {
                            type: ShadingType.SOLID,
                            color: "FFFFFF"
                        },
                        children: [
                            new Paragraph("Constructed"),
                        ],
                        verticalAlign: VerticalAlign.CENTER,
                    }),
                    new TableCell({
                        width: {
                            size: "33.33%",
                        },
                        shading: {
                            type: ShadingType.SOLID,
                            color: "FFFFFF"
                        },
                        children: [
                            new Paragraph("56874.875"),
                        ],
                        verticalAlign: VerticalAlign.CENTER,
                    }),
                    new TableCell({
                        width: {
                            size: "33.33%",
                        },
                        shading: {
                            type: ShadingType.SOLID,
                            color: "FFFFFF"
                        },
                        children: [
                            new Paragraph("160"),
                        ],
                        verticalAlign: VerticalAlign.CENTER,
                    }),
                ]
            }),
            new TableRow({
                height: {
                    value: "0.5cm",
                    rule: HeightRule.EXACT
                },
                children: [
                    new TableCell({
                        width: {
                            size: "33.33%",
                        },
                        shading: {
                            type: ShadingType.SOLID,
                            color: "FFFFFF"
                        },
                        children: [
                            new Paragraph("Empty Plot"),
                        ],
                        verticalAlign: VerticalAlign.CENTER,
                    }),
                    new TableCell({
                        width: {
                            size: "33.33%",
                        },
                        shading: {
                            type: ShadingType.SOLID,
                            color: "FFFFFF"
                        },
                        children: [
                            new Paragraph("25770.417"),
                        ],
                        verticalAlign: VerticalAlign.CENTER,
                    }),
                    new TableCell({
                        width: {
                            size: "33.33%",
                        },
                        shading: {
                            type: ShadingType.SOLID,
                            color: "FFFFFF"
                        },
                        children: [
                            new Paragraph("57"),
                        ],
                        verticalAlign: VerticalAlign.CENTER,
                    }),
                ]
            }),
            new TableRow({
                height: {
                    value: "0.5cm",
                    rule: HeightRule.EXACT
                },
                children: [
                    new TableCell({
                        width: {
                            size: "33.33%",
                        },
                        shading: {
                            type: ShadingType.SOLID,
                            color: "FFFFFF"
                        },
                        children: [
                            new Paragraph("Under Construction"),
                        ],
                        verticalAlign: VerticalAlign.CENTER,
                    }),
                    new TableCell({
                        width: {
                            size: "33.33%",
                        },
                        shading: {
                            type: ShadingType.SOLID,
                            color: "FFFFFF"
                        },
                        children: [
                            new Paragraph("8087.561"),
                        ],
                        verticalAlign: VerticalAlign.CENTER,
                    }),
                    new TableCell({
                        width: {
                            size: "33.33%",
                        },
                        shading: {
                            type: ShadingType.SOLID,
                            color: "FFFFFF"
                        },
                        children: [
                            new Paragraph("23"),
                        ],
                        verticalAlign: VerticalAlign.CENTER,
                    }),
                ]
            }),
            new TableRow({
                height: {
                    value: "0.5cm",
                    rule: HeightRule.EXACT
                },
                cantSplit: false,
                children: [
                    new TableCell({
                        width: {
                            size: "33.33%",
                        },
                        shading: {
                            type: ShadingType.SOLID,
                            color: "D9E1F2"
                        },
                        children: [
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: "Grand Total",
                                        bold: true,
                                    })
                                ]
                            }),
                        ],
                        verticalAlign: VerticalAlign.CENTER,
                    }),
                    new TableCell({
                        width: {
                            size: "33.33%",
                        },
                        shading: {
                            type: ShadingType.SOLID,
                            color: "D9E1F2"
                        },
                        children: [
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: "90732.853",
                                        bold: true,
                                    })
                                ]
                            }),
                        ],
                        verticalAlign: VerticalAlign.CENTER,
                    }),
                    new TableCell({
                        width: {
                            size: "33.33%",
                        },
                        shading: {
                            type: ShadingType.SOLID,
                            color: "D9E1F2"
                        },
                        children: [
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: "229",
                                        bold: true,
                                    })
                                ]
                            }),
                        ],
                        verticalAlign: VerticalAlign.CENTER,
                    }),
                ]
            })
        ]
    });

    const images = new Paragraph({
        frame: {
            position: {
                x: -500,
                y: -500,
            },
            width: 16000,
            height: 10760,
            anchor: {
                horizontal: FrameAnchorType.MARGIN,
                vertical: FrameAnchorType.MARGIN,
            },
        },
        shading: {
            color: "60AEDC",
            type: ShadingType.SOLID,
        },
        children: [
            new ImageRun({
                data: barChart,
                transformation: {
                    width: 350,
                    height: 260,
                },
                floating: {
                    zIndex: 9,
                    horizontalPosition: {
                        relative: HorizontalPositionRelativeFrom.LEFT_MARGIN,
                        offset: 514400,
                    },
                    verticalPosition: {
                        relative: VerticalPositionRelativeFrom.TOP_MARGIN,
                        offset: 1804400,
                    }
                },
            }),
            new ImageRun({
                data: categoryPieChart,
                transformation: {
                    width: 270,
                    height: 250,
                },
                floating: {
                    zIndex: 9,
                    horizontalPosition: {
                        relative: HorizontalPositionRelativeFrom.LEFT_MARGIN,
                        offset: 5514400,
                    },
                    verticalPosition: {
                        relative: VerticalPositionRelativeFrom.TOP_MARGIN,
                        offset: 1904400,
                    }
                },
            }),
            new ImageRun({
                data: statusPieChart,
                transformation: {
                    width: 215,
                    height: 200,
                },
                floating: {
                    zIndex: 9,
                    horizontalPosition: {
                        relative: HorizontalPositionRelativeFrom.LEFT_MARGIN,
                        offset: 5714400,
                    },
                    verticalPosition: {
                        relative: VerticalPositionRelativeFrom.TOP_MARGIN,
                        offset: 5000000,
                    }
                },
            }),
            new ImageRun({
                data: fs.readFileSync(path.join(__dirname, "images", "NKDA_Logo.png")),
                transformation: {
                    width: 50,
                    height: 50,
                },
                floating: {
                    zIndex: 9,
                    horizontalPosition: {
                        relative: HorizontalPositionRelativeFrom.RIGHT_MARGIN,
                        offset: -814400,
                    },
                    verticalPosition: {
                        relative: VerticalPositionRelativeFrom.TOP_MARGIN,
                        offset: 304400,
                    }
                },
            }),
            new ImageRun({
                data: fs.readFileSync(path.join(__dirname, "images", "Kesowa_Logo.png")),
                transformation: {
                    width: 80,
                    height: 40,
                },
                floating: {
                    zIndex: 9,
                    horizontalPosition: {
                        relative: HorizontalPositionRelativeFrom.RIGHT_MARGIN,
                        offset: -950000,
                    },
                    verticalPosition: {
                        relative: VerticalPositionRelativeFrom.TOP_MARGIN,
                        offset: 6354400,
                    }
                },
            }),
        ],
    });

    const idTextBox = new Paragraph({
        frame: {
            position: {
                x: 12100,
                y: 0,
            },
            width: 2000,
            height: 500,
            anchor: {
                horizontal: FrameAnchorType.MARGIN,
                vertical: FrameAnchorType.MARGIN,
            },
        },
        children: [
            new TextRun({
                text: "FSIPL/NKDA/R/003",
                color: "D9D9D9",
                size: "10pt",
                font: {
                    name: "Arial MT",
                },
            }),
        ],
    });

    const imageBorderTextBox = new Paragraph({
        frame: {
            position: {
                x: -500,
                y: 1800,
            },
            width: 14350,
            height: 8500,
            anchor: {
                horizontal: FrameAnchorType.MARGIN,
                vertical: FrameAnchorType.MARGIN,
            },
        },
        shading: {
            color: "D9D9D9",
            type: ShadingType.SOLID,
        },
        children: [],
    });

    return {
        properties: commonPageProperties,
        footers: commonPageFooter,
        children: [
            images,
            imageBorderTextBox,
            table1,
            table2,
            headings,
            categoryPieChartHeading,
            statusPieChartHeading,
            barChartHeading,
            idTextBox,
        ],
    };
}