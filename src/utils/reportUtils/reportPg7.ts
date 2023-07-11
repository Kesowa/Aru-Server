import { Paragraph, FrameAnchorType, ShadingType, ImageRun, HorizontalPositionRelativeFrom, VerticalPositionRelativeFrom, AlignmentType, TextRun, Table, TableRow, HeightRule, TableCell, VerticalAlign } from "docx";
import * as fs from "fs";
import { commonPageProperties, commonPageFooter } from "./reportUtils";
import { IPage7Properties } from "./types";
import path from "path";
import * as d3 from "d3";
import { JSDOM } from "jsdom";
import sharp from "sharp";

const genPieChart = async (data: any) => {
    const document = new JSDOM().window.document;
    
    const width = 500;
    const height = 500;

    // ============================================================================================

    // Create the pie layout and arc generator.
    const pie = d3.pie().value(d => d.percent);

    const arc = d3.arc()
        .innerRadius(0)
        .outerRadius(Math.min(width, height) / 2 - 1);

    const labelRadius = arc.outerRadius()() * 0.5;

    // A separate arc generator for labels.
    const arcLabel = d3.arc()
        .innerRadius(labelRadius)
        .outerRadius(labelRadius);

    const arcs = pie(data);

    // Create the SVG container.
    const svg = d3
        .select(document.body)
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [-width / 2, -height / 2, width, height])
        .attr("style", "font: 24px sans-serif;");

    // Add a sector path for each value.
    svg.append("g")
        .attr("stroke", "white")
        .selectAll()
        .data(arcs)
        .join("path")
        .attr("fill", d => d.data.color)
        .attr("d", arc);

    // Create a new arc generator to place a label close to the edge.
    // The label shows the value if there is enough room.
    svg.append("g")
        .attr("text-anchor", "middle")
        .selectAll()
        .data(arcs)
        .join("text")
        .attr("transform", d => `translate(${arcLabel.centroid(d)})`)
        .call(text => text.append("tspan")
            .attr("y", "-0.4em")
            .attr("font-weight", "bold")
            .text(d => `${d.data.percent.toLocaleString("en-US")}%`));
        // .call(text => text.append("tspan")
        //     .attr("y", "-0.4em")
        //     .attr("font-weight", "bold")
        //     .text(d => d.data.name))
        // .call(text => text.filter(d => (d.endAngle - d.startAngle) > 0.25).append("tspan")
        //     .attr("x", 0)
        //     .attr("y", "0.7em")
        //     .attr("font-weight", "bold")
        //     .text(d => `${d.data.percent.toLocaleString("en-US")}%`));

    // ========================================================================================================

    const buff = Buffer.from(svg.node().outerHTML);

    const pngBuff = await sharp(buff).png().toBuffer();

    return pngBuff;
}

const genStackedBarChart = async (data: any[]) => {
    const document = new JSDOM().window.document;
    
    let groups: any[] = [];
    let subgroups: any[] = Object.keys(data[0]).filter(g => (g != "name"));
    
    for(let d of data) groups.push(d.name);

    let margin = {top: 50, right: 30, bottom: 20, left: 50};
    const width = 500 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    const svg = d3
        .select(document.body)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);

    var x = d3.scaleBand()
        .domain(groups)
        .range([0, width])
        .padding(0.2)
    svg.append("g")
        .attr("transform", `translate(${margin.left},${height + margin.top})`)
        .attr("style", "font-size: 15px;")
        .call(d3.axisBottom(x).tickSizeOuter(0));

    var y = d3.scaleLinear()
        .domain([0, 100])
        .range([ height, 0 ]);
    svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`)
        .attr("style", "font-size: 15px;")
        .call(d3.axisLeft(y));

    data = data.map((d) => {
        let total = 0;
        let normalized_d: any = {};
        normalized_d["name"] = d["name"];
        for (let sub of subgroups){ total += d[sub]; }
        for (let sub of subgroups){ normalized_d[sub] = d[sub] / total * 100; }
        return normalized_d;
      });

    const stackedData = d3.stack().keys(subgroups)(data);

    var color = d3.scaleOrdinal()
        .domain(subgroups)
        .range(['#e01ea3', '#df7c12', '#8277da']);

    var bar_groups = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`)
        .selectAll("g")
        .data(stackedData)
        .enter().append("g")
        .attr("fill", function(d) { return color(d.key); })

    var bars = bar_groups.selectAll("g")
        .data(function(d) { return d; })
        .enter().append("g")
    
    bars.append('rect')
        .attr("x", function(d) { return x(d.data.name); })
        .attr("y", function(d) { return y(d[1]); })
        .attr("height", function(d) { return y(d[0]) - y(d[1]); })
        .attr("width", x.bandwidth());

    bars.append("text")
        .text(function(d) { return d3.format(".2s")(d[1]-d[0])+"%"; })
        .attr("y", function(d) { return y(d[1])+(y(d[0]) - y(d[1]))/2; })
        .attr("x", function(d) { return x(d.data.name) + (x.bandwidth() * 0.4); })
        .style("fill", '#000000')
        .attr("font-size", "15")
        .attr("font-weight", "bold");

    const buff = Buffer.from(svg.node().outerHTML);

    const pngBuff = await sharp(buff).png().toBuffer();

    return pngBuff;
}

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