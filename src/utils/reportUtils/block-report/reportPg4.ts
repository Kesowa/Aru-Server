import {
  Paragraph,
  FrameAnchorType,
  ShadingType,
  ImageRun,
  HorizontalPositionRelativeFrom,
  VerticalPositionRelativeFrom,
  AlignmentType,
  TextRun,
  Table,
  TableRow,
  HeightRule,
  TableCell,
  VerticalAlign,
} from "docx";
import * as fs from "fs";
import { commonPageProperties, commonPageFooter } from "../reportUtils";
import { IPage7Properties } from "./types";
import path from "path";

export const page4 = (properties: IPage7Properties) => {
  const {
    heading,
    subheading,
    categoryPieChart,
    statusPieChart,
    barChart,
    area,
    occupancy,
  } = properties;

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
    ],
  });

  const table1 = new Table({
    borders: {},
    width: {
      size: "9.5cm",
    },
    float: {
      absoluteHorizontalPosition: "0cm",
      absoluteVerticalPosition: "12.4cm",
    },
    rows: [
      new TableRow({
        height: {
          value: "0.5cm",
          rule: HeightRule.EXACT,
        },
        children: [
          new TableCell({
            width: {
              size: "33.33%",
            },
            shading: {
              type: ShadingType.SOLID,
              color: "D9E1F2",
            },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Plot Category",
                    bold: true,
                  }),
                ],
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
              color: "D9E1F2",
            },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Plot Area In Sq. Mt.",
                    bold: true,
                  }),
                ],
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
              color: "D9E1F2",
            },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "No. of Plots",
                    bold: true,
                  }),
                ],
              }),
            ],
            verticalAlign: VerticalAlign.CENTER,
          }),
        ],
      }),
      new TableRow({
        height: {
          value: "0.5cm",
          rule: HeightRule.EXACT,
        },
        children: [
          new TableCell({
            width: {
              size: "33.33%",
            },
            shading: {
              type: ShadingType.SOLID,
              color: "FFFFFF",
            },
            children: [new Paragraph("Government")],
            verticalAlign: VerticalAlign.CENTER,
          }),
          new TableCell({
            width: {
              size: "33.33%",
            },
            shading: {
              type: ShadingType.SOLID,
              color: "FFFFFF",
            },
            children: [
              new Paragraph(
                area.publicSpaces
                  .find((obj) => obj.name === "Government")
                  .value.toString()
              ),
            ],
            verticalAlign: VerticalAlign.CENTER,
          }),
          new TableCell({
            width: {
              size: "33.33%",
            },
            shading: {
              type: ShadingType.SOLID,
              color: "FFFFFF",
            },
            children: [
              new Paragraph(
                (
                  occupancy.find((obj) => obj.name === "Government").occupied +
                  occupancy.find((obj) => obj.name === "Government")
                    .underConstruction +
                  occupancy.find((obj) => obj.name === "Government").vacant
                ).toString()
              ),
            ],
            verticalAlign: VerticalAlign.CENTER,
          }),
        ],
      }),
      new TableRow({
        height: {
          value: "0.5cm",
          rule: HeightRule.EXACT,
        },
        children: [
          new TableCell({
            width: {
              size: "33.33%",
            },
            shading: {
              type: ShadingType.SOLID,
              color: "FFFFFF",
            },
            children: [new Paragraph("Residential")],
            verticalAlign: VerticalAlign.CENTER,
          }),
          new TableCell({
            width: {
              size: "33.33%",
            },
            shading: {
              type: ShadingType.SOLID,
              color: "FFFFFF",
            },
            children: [
              new Paragraph(
                area.privateSpaces
                  .find((obj) => obj.name === "Residential")
                  .value.toString()
              ),
            ],
            verticalAlign: VerticalAlign.CENTER,
          }),
          new TableCell({
            width: {
              size: "33.33%",
            },
            shading: {
              type: ShadingType.SOLID,
              color: "FFFFFF",
            },
            children: [
              new Paragraph(
                (
                  occupancy.find((obj) => obj.name === "Residential").occupied +
                  occupancy.find((obj) => obj.name === "Residential")
                    .underConstruction +
                  occupancy.find((obj) => obj.name === "Residential").vacant
                ).toString()
              ),
            ],
            verticalAlign: VerticalAlign.CENTER,
          }),
        ],
      }),
      new TableRow({
        height: {
          value: "0.5cm",
          rule: HeightRule.EXACT,
        },
        children: [
          new TableCell({
            width: {
              size: "33.33%",
            },
            shading: {
              type: ShadingType.SOLID,
              color: "D9E1F2",
            },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Grand Total",
                    bold: true,
                  }),
                ],
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
              color: "D9E1F2",
            },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: (
                      area.publicSpaces.find((obj) => obj.name === "Government")
                        .value +
                      area.privateSpaces.find(
                        (obj) => obj.name === "Residential"
                      ).value
                    ).toString(),
                    bold: true,
                  }),
                ],
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
              color: "D9E1F2",
            },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: (
                      occupancy.find((obj) => obj.name === "Residential")
                        .occupied +
                      occupancy.find((obj) => obj.name === "Residential")
                        .underConstruction +
                      occupancy.find((obj) => obj.name === "Residential")
                        .vacant +
                      occupancy.find((obj) => obj.name === "Government")
                        .occupied +
                      occupancy.find((obj) => obj.name === "Government")
                        .underConstruction +
                      occupancy.find((obj) => obj.name === "Government").vacant
                    ).toString(),
                    bold: true,
                  }),
                ],
              }),
            ],
            verticalAlign: VerticalAlign.CENTER,
          }),
        ],
      }),
    ],
  });

  const table2 = new Table({
    width: {
      size: "9.5cm",
    },
    float: {
      absoluteHorizontalPosition: "0cm",
      absoluteVerticalPosition: "14.75cm",
    },
    rows: [
      new TableRow({
        height: {
          value: "0.5cm",
          rule: HeightRule.EXACT,
        },
        children: [
          new TableCell({
            width: {
              size: "33.33%",
            },
            shading: {
              type: ShadingType.SOLID,
              color: "D9E1F2",
            },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Building Status",
                    bold: true,
                  }),
                ],
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
              color: "D9E1F2",
            },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Plot Area In Sq. Mt.",
                    bold: true,
                  }),
                ],
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
              color: "D9E1F2",
            },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "No. of Plots",
                    bold: true,
                  }),
                ],
              }),
            ],
            verticalAlign: VerticalAlign.CENTER,
          }),
        ],
      }),
      new TableRow({
        height: {
          value: "0.5cm",
          rule: HeightRule.EXACT,
        },
        children: [
          new TableCell({
            width: {
              size: "33.33%",
            },
            shading: {
              type: ShadingType.SOLID,
              color: "FFFFFF",
            },
            children: [new Paragraph("Constructed")],
            verticalAlign: VerticalAlign.CENTER,
          }),
          new TableCell({
            width: {
              size: "33.33%",
            },
            shading: {
              type: ShadingType.SOLID,
              color: "FFFFFF",
            },
            children: [new Paragraph("56874.875")],
            verticalAlign: VerticalAlign.CENTER,
          }),
          new TableCell({
            width: {
              size: "33.33%",
            },
            shading: {
              type: ShadingType.SOLID,
              color: "FFFFFF",
            },
            children: [new Paragraph("160")],
            verticalAlign: VerticalAlign.CENTER,
          }),
        ],
      }),
      new TableRow({
        height: {
          value: "0.5cm",
          rule: HeightRule.EXACT,
        },
        children: [
          new TableCell({
            width: {
              size: "33.33%",
            },
            shading: {
              type: ShadingType.SOLID,
              color: "FFFFFF",
            },
            children: [new Paragraph("Empty Plot")],
            verticalAlign: VerticalAlign.CENTER,
          }),
          new TableCell({
            width: {
              size: "33.33%",
            },
            shading: {
              type: ShadingType.SOLID,
              color: "FFFFFF",
            },
            children: [new Paragraph("25770.417")],
            verticalAlign: VerticalAlign.CENTER,
          }),
          new TableCell({
            width: {
              size: "33.33%",
            },
            shading: {
              type: ShadingType.SOLID,
              color: "FFFFFF",
            },
            children: [new Paragraph("57")],
            verticalAlign: VerticalAlign.CENTER,
          }),
        ],
      }),
      new TableRow({
        height: {
          value: "0.5cm",
          rule: HeightRule.EXACT,
        },
        children: [
          new TableCell({
            width: {
              size: "33.33%",
            },
            shading: {
              type: ShadingType.SOLID,
              color: "FFFFFF",
            },
            children: [new Paragraph("Under Construction")],
            verticalAlign: VerticalAlign.CENTER,
          }),
          new TableCell({
            width: {
              size: "33.33%",
            },
            shading: {
              type: ShadingType.SOLID,
              color: "FFFFFF",
            },
            children: [new Paragraph("8087.561")],
            verticalAlign: VerticalAlign.CENTER,
          }),
          new TableCell({
            width: {
              size: "33.33%",
            },
            shading: {
              type: ShadingType.SOLID,
              color: "FFFFFF",
            },
            children: [new Paragraph("23")],
            verticalAlign: VerticalAlign.CENTER,
          }),
        ],
      }),
      new TableRow({
        height: {
          value: "0.5cm",
          rule: HeightRule.EXACT,
        },
        cantSplit: false,
        children: [
          new TableCell({
            width: {
              size: "33.33%",
            },
            shading: {
              type: ShadingType.SOLID,
              color: "D9E1F2",
            },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Grand Total",
                    bold: true,
                  }),
                ],
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
              color: "D9E1F2",
            },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "90732.853",
                    bold: true,
                  }),
                ],
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
              color: "D9E1F2",
            },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "229",
                    bold: true,
                  }),
                ],
              }),
            ],
            verticalAlign: VerticalAlign.CENTER,
          }),
        ],
      }),
    ],
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
          width: 450,
          height: 300,
        },
        floating: {
          zIndex: 9,
          horizontalPosition: {
            relative: HorizontalPositionRelativeFrom.LEFT_MARGIN,
            offset: 314400,
          },
          verticalPosition: {
            relative: VerticalPositionRelativeFrom.TOP_MARGIN,
            offset: 1704400,
          },
        },
      }),
      new ImageRun({
        data: categoryPieChart,
        transformation: {
          width: 400,
          height: 300,
        },
        floating: {
          zIndex: 9,
          horizontalPosition: {
            relative: HorizontalPositionRelativeFrom.LEFT_MARGIN,
            offset: 5014400,
          },
          verticalPosition: {
            relative: VerticalPositionRelativeFrom.TOP_MARGIN,
            offset: 1704400,
          },
        },
      }),
      new ImageRun({
        data: statusPieChart,
        transformation: {
          width: 300,
          height: 200,
        },
        floating: {
          zIndex: 9,
          horizontalPosition: {
            relative: HorizontalPositionRelativeFrom.LEFT_MARGIN,
            offset: 5414400,
          },
          verticalPosition: {
            relative: VerticalPositionRelativeFrom.TOP_MARGIN,
            offset: 4800000,
          },
        },
      }),
      new ImageRun({
        data: fs.readFileSync(path.join(__dirname, "..", "assets", "NKDA_Logo.png")),
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
          },
        },
      }),
      new ImageRun({
        data: fs.readFileSync(
          path.join(__dirname, "..", "assets", "Kesowa_Logo.png")
        ),
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
          },
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
    children: [images, imageBorderTextBox, table1, table2, headings, idTextBox],
  };
};
