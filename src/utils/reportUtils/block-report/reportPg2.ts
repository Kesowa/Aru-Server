import {
  Table,
  TableRow,
  HeightRule,
  TableCell,
  Paragraph,
  TextRun,
  BorderStyle,
  VerticalAlign,
  FrameAnchorType,
  HorizontalPositionRelativeFrom,
  ImageRun,
  VerticalPositionRelativeFrom,
  AlignmentType,
  HorizontalPositionAlign,
  ShadingType,
  VerticalPositionAlign,
} from "docx";
import { commonPageFooter, commonPageProperties } from "../reportUtils";
import {
  IAreaData,
  IAreaDesc,
  IOccupancyDesc,
  IPage2Properties,
} from "./types";

const roundOffTo2DecimalPlaces = (val: number) => {
  return Math.round(val * 100) / 100;
};
const sqMtrToAcres = (sqMtr: number) => {
  return roundOffTo2DecimalPlaces(0.000247105 * sqMtr);
}; // correct to last 2 decimal places
const sqMtrToSqKm = (sqMtr: number) => {
  return roundOffTo2DecimalPlaces(0.000001 * sqMtr);
}; // correct to last 2 decimal places

const table1 = (area: IAreaData) => {
  return new Table({
    width: {
      size: "13.97cm",
    },
    float: {
      absoluteHorizontalPosition: "0cm",
      absoluteVerticalPosition: "0.5cm",
    },
    rows: [
      new TableRow({
        height: {
          value: "0.6cm",
          rule: HeightRule.EXACT,
        },
        children: [
          new TableCell({
            width: {
              size: "40%",
            },
            rowSpan: 2,
            columnSpan: 2,
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Total Area of Block",
                    bold: true,
                  }),
                ],
              }),
            ],
            borders: {
              bottom: {
                style: BorderStyle.THICK,
                color: "000000",
                size: 15,
              },
            },
            verticalAlign: VerticalAlign.CENTER,
          }),
          new TableCell({
            width: {
              size: "20%",
            },
            children: [new Paragraph("Area in Sq. Km.")],
          }),
          new TableCell({
            width: {
              size: "20%",
            },
            children: [new Paragraph("Area in Sq. Mt.")],
          }),
          new TableCell({
            width: {
              size: "20%",
            },
            children: [new Paragraph("Area in Acres.")],
            borders: {
              right: {
                style: BorderStyle.THICK,
                color: "000000",
                size: 15,
              },
            },
          }),
        ],
      }),
      new TableRow({
        height: {
          value: "0.6cm",
          rule: HeightRule.EXACT,
        },
        children: [
          new TableCell({
            width: {
              size: "20%",
            },
            children: [new Paragraph(sqMtrToSqKm(area.total).toString())],
            borders: {
              bottom: {
                style: BorderStyle.THICK,
                color: "000000",
                size: 15,
              },
            },
          }),
          new TableCell({
            width: {
              size: "20%",
            },
            children: [new Paragraph(area.total.toString())],
            borders: {
              bottom: {
                style: BorderStyle.THICK,
                color: "000000",
                size: 15,
              },
            },
          }),
          new TableCell({
            width: {
              size: "20%",
            },
            children: [new Paragraph(sqMtrToAcres(area.total).toString())],
            borders: {
              bottom: {
                style: BorderStyle.THICK,
                color: "000000",
                size: 15,
              },
              right: {
                style: BorderStyle.THICK,
                color: "000000",
                size: 15,
              },
            },
          }),
        ],
      }),
      new TableRow({
        height: {
          value: "0.6cm",
          rule: HeightRule.EXACT,
        },
        children: [
          new TableCell({
            width: {
              size: "40%",
            },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Structure of Block",
                    bold: true,
                  }),
                ],
              }),
            ],
            columnSpan: 2,
          }),
          new TableCell({
            width: {
              size: "40%",
            },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Boundary Area",
                    bold: true,
                  }),
                ],
              }),
            ],
            columnSpan: 2,
          }),
          new TableCell({
            width: {
              size: "20%",
            },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Total % Area",
                    bold: true,
                  }),
                ],
              }),
            ],
            borders: {
              right: {
                style: BorderStyle.THICK,
                color: "000000",
                size: 15,
              },
            },
          }),
        ],
      }),
      new TableRow({
        height: {
          value: "0.6cm",
          rule: HeightRule.EXACT,
        },
        children: [
          new TableCell({
            width: {
              size: "40%",
            },
            children: [],
            columnSpan: 2,
          }),
          new TableCell({
            width: {
              size: "20%",
            },
            children: [new Paragraph("In Sq. Mt.")],
          }),
          new TableCell({
            width: {
              size: "20%",
            },
            children: [new Paragraph("In Acres")],
          }),
          new TableCell({
            width: {
              size: "20%",
            },
            children: [new Paragraph("100")],
            borders: {
              right: {
                style: BorderStyle.THICK,
                color: "000000",
                size: 15,
              },
            },
          }),
        ],
      }),
      new TableRow({
        height: {
          value: "0.6cm",
          rule: HeightRule.EXACT,
        },
        children: [
          new TableCell({
            width: {
              size: "40%",
            },
            children: [new Paragraph("Private Space")],
            verticalAlign: VerticalAlign.CENTER,
            columnSpan: 2,
          }),
          new TableCell({
            width: {
              size: "20%",
            },
            children: [],
          }),
          new TableCell({
            width: {
              size: "20%",
            },
            children: [],
          }),
          new TableCell({
            width: {
              size: "20%",
            },
            children: [],
            borders: {
              right: {
                style: BorderStyle.THICK,
                color: "000000",
                size: 15,
              },
            },
          }),
        ],
      }),
      new TableRow({
        height: {
          value: "0.6cm",
          rule: HeightRule.EXACT,
        },
        children: [
          new TableCell({
            width: {
              size: "10%",
            },
            children: [],
            rowSpan: area.privateSpaces.length,
          }),
          new TableCell({
            width: {
              size: "30%",
            },
            children: [new Paragraph(area.privateSpaces[0].name)],
            verticalAlign: VerticalAlign.CENTER,
          }),
          new TableCell({
            width: {
              size: "20%",
            },
            children: [new Paragraph(area.privateSpaces[0].value.toString())],
          }),
          new TableCell({
            width: {
              size: "20%",
            },
            children: [
              new Paragraph(
                sqMtrToAcres(area.privateSpaces[0].value).toString()
              ),
            ],
          }),
          new TableCell({
            width: {
              size: "20%",
            },
            children: [
              new Paragraph(
                roundOffTo2DecimalPlaces(
                  area.total === 0
                    ? 0
                    : (area.privateSpaces[0].value / area.total) * 100
                ).toString()
              ),
            ],
            borders: {
              right: {
                style: BorderStyle.THICK,
                color: "000000",
                size: 15,
              },
            },
          }),
        ],
      }),
      ...area.privateSpaces.slice(1).map((ps: IAreaDesc) => {
        return new TableRow({
          height: {
            value: "0.6cm",
            rule: HeightRule.EXACT,
          },
          children: [
            new TableCell({
              width: {
                size: "30%",
              },
              children: [new Paragraph(ps.name)],
              verticalAlign: VerticalAlign.CENTER,
            }),
            new TableCell({
              width: {
                size: "20%",
              },
              children: [new Paragraph(ps.value.toString())],
            }),
            new TableCell({
              width: {
                size: "20%",
              },
              children: [new Paragraph(sqMtrToAcres(ps.value).toString())],
            }),
            new TableCell({
              width: {
                size: "20%",
              },
              children: [
                new Paragraph(
                  roundOffTo2DecimalPlaces(
                    area.total === 0 ? 0 : (ps.value / area.total) * 100
                  ).toString()
                ),
              ],
              borders: {
                right: {
                  style: BorderStyle.THICK,
                  color: "000000",
                  size: 15,
                },
              },
            }),
          ],
        });
      }),
      new TableRow({
        height: {
          value: "0.6cm",
          rule: HeightRule.EXACT,
        },
        children: [
          new TableCell({
            width: {
              size: "40%",
            },
            children: [new Paragraph("Public Space")],
            verticalAlign: VerticalAlign.CENTER,
            columnSpan: 2,
          }),
          new TableCell({
            width: {
              size: "20%",
            },
            children: [],
          }),
          new TableCell({
            width: {
              size: "20%",
            },
            children: [],
          }),
          new TableCell({
            width: {
              size: "20%",
            },
            children: [],
            borders: {
              right: {
                style: BorderStyle.THICK,
                color: "000000",
                size: 15,
              },
            },
          }),
        ],
      }),
      new TableRow({
        height: {
          value: "0.6cm",
          rule: HeightRule.EXACT,
        },
        children: [
          new TableCell({
            width: {
              size: "10%",
            },
            children: [],
            rowSpan: area.publicSpaces.length,
          }),
          new TableCell({
            width: {
              size: "30%",
            },
            children: [new Paragraph(area.publicSpaces[0].name)],
            verticalAlign: VerticalAlign.CENTER,
          }),
          new TableCell({
            width: {
              size: "20%",
            },
            children: [new Paragraph(area.publicSpaces[0].value.toString())],
          }),
          new TableCell({
            width: {
              size: "20%",
            },
            children: [
              new Paragraph(
                sqMtrToAcres(area.publicSpaces[0].value).toString()
              ),
            ],
          }),
          new TableCell({
            width: {
              size: "20%",
            },
            children: [
              new Paragraph(
                roundOffTo2DecimalPlaces(
                  area.total === 0
                    ? 0
                    : (area.publicSpaces[0].value / area.total) * 100
                ).toString()
              ),
            ],
            borders: {
              right: {
                style: BorderStyle.THICK,
                color: "000000",
                size: 15,
              },
            },
          }),
        ],
      }),
      ...area.publicSpaces.slice(1).map((ps: IAreaDesc) => {
        return new TableRow({
          height: {
            value: "0.6cm",
            rule: HeightRule.EXACT,
          },
          children: [
            new TableCell({
              width: {
                size: "30%",
              },
              children: [new Paragraph(ps.name)],
              verticalAlign: VerticalAlign.CENTER,
            }),
            new TableCell({
              width: {
                size: "20%",
              },
              children: [new Paragraph(ps.value.toString())],
            }),
            new TableCell({
              width: {
                size: "20%",
              },
              children: [new Paragraph(sqMtrToAcres(ps.value).toString())],
            }),
            new TableCell({
              width: {
                size: "20%",
              },
              children: [
                new Paragraph(
                  roundOffTo2DecimalPlaces(
                    area.total === 0 ? 0 : (ps.value / area.total) * 100
                  ).toString()
                ),
              ],
              borders: {
                right: {
                  style: BorderStyle.THICK,
                  color: "000000",
                  size: 15,
                },
              },
            }),
          ],
        });
      }),
      new TableRow({
        height: {
          value: "0.6cm",
          rule: HeightRule.EXACT,
        },
        children: [
          new TableCell({
            width: {
              size: "40%",
            },
            children: [new Paragraph("Other")],
            verticalAlign: VerticalAlign.CENTER,
            columnSpan: 2,
            borders: {
              bottom: {
                style: BorderStyle.THICK,
                color: "000000",
                size: 15,
              },
            },
          }),
          new TableCell({
            width: {
              size: "20%",
            },
            children: [new Paragraph(area.other.toString())],
            borders: {
              bottom: {
                style: BorderStyle.THICK,
                color: "000000",
                size: 15,
              },
            },
          }),
          new TableCell({
            width: {
              size: "20%",
            },
            children: [new Paragraph(sqMtrToAcres(area.other).toString())],
            borders: {
              bottom: {
                style: BorderStyle.THICK,
                color: "000000",
                size: 15,
              },
            },
          }),
          new TableCell({
            width: {
              size: "20%",
            },
            children: [
              new Paragraph(
                roundOffTo2DecimalPlaces(
                  area.total === 0 ? 0 : (area.other / area.total) * 100
                ).toString()
              ),
            ],
            borders: {
              bottom: {
                style: BorderStyle.THICK,
                color: "000000",
                size: 15,
              },
              right: {
                style: BorderStyle.THICK,
                color: "000000",
                size: 15,
              },
            },
          }),
        ],
      }),
    ],
  });
};

const table2 = (occupancy: IOccupancyDesc[]) => {
  return new Table({
    width: {
      size: "13.97cm",
    },
    float: {
      absoluteHorizontalPosition: "0cm",
      absoluteVerticalPosition: "12cm",
    },
    borders: {
      right: {
        style: BorderStyle.THICK,
        color: "000000",
        size: 15,
      },
      bottom: {
        style: BorderStyle.THICK,
        color: "000000",
        size: 15,
      },
    },
    rows: [
      new TableRow({
        height: {
          value: "0.9cm",
          rule: HeightRule.EXACT,
        },
        children: [
          new TableCell({
            width: {
              size: "100%",
            },
            columnSpan: 5,
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Occupancy",
                    bold: true,
                  }),
                ],
              }),
            ],
            borders: {
              bottom: {
                style: BorderStyle.THICK,
                color: "000000",
                size: 15,
              },
              right: {
                style: BorderStyle.THICK,
                color: "000000",
                size: 15,
              },
            },
            verticalAlign: VerticalAlign.CENTER,
          }),
        ],
      }),
      new TableRow({
        height: {
          value: "0.9cm",
          rule: HeightRule.EXACT,
        },
        children: [
          new TableCell({
            width: {
              size: "20%",
            },
            children: [],
          }),
          new TableCell({
            width: {
              size: "20%",
            },
            children: [new Paragraph("Visibly Occupied")],
          }),
          new TableCell({
            width: {
              size: "20%",
            },
            children: [new Paragraph("Visibly Under Cons.")],
          }),
          new TableCell({
            width: {
              size: "20%",
            },
            children: [new Paragraph("Visibly Vacant")],
          }),
          new TableCell({
            width: {
              size: "20%",
            },
            children: [new Paragraph("Total No. of Plots")],
            borders: {
              right: {
                style: BorderStyle.THICK,
                color: "000000",
                size: 15,
              },
            },
          }),
        ],
      }),
      ...occupancy.map((occ) => {
        return new TableRow({
          height: {
            value: "0.45cm",
            rule: HeightRule.EXACT,
          },
          children: [
            new TableCell({
              width: {
                size: "20%",
              },
              children: [new Paragraph(occ.name)],
            }),
            new TableCell({
              width: {
                size: "20%",
              },
              children: [new Paragraph(occ.occupied.toString())],
            }),
            new TableCell({
              width: {
                size: "20%",
              },
              children: [new Paragraph(occ.underConstruction.toString())],
            }),
            new TableCell({
              width: {
                size: "20%",
              },
              children: [new Paragraph(occ.vacant.toString())],
            }),
            new TableCell({
              width: {
                size: "20%",
              },
              children: [
                new Paragraph(
                  (occ.occupied + occ.underConstruction + occ.vacant).toString()
                ),
              ],
            }),
          ],
        });
      }),
    ],
  });
};

const textBoxBelowTable2 = new Paragraph({
  frame: {
    position: {
      x: 50,
      y: 9500,
    },
    width: 7850,
    height: 1000,
    anchor: {
      horizontal: FrameAnchorType.MARGIN,
      vertical: FrameAnchorType.MARGIN,
    },
  },
  border: {
    top: { style: BorderStyle.SINGLE, size: 7 },
    bottom: { style: BorderStyle.SINGLE, size: 7 },
    left: { style: BorderStyle.SINGLE, size: 7 },
    right: { style: BorderStyle.SINGLE, size: 7 },
  },
  children: [
    new TextRun(
      "**(Building Occupied: Sanctioned Plot, Which Have Received Completion Certificate, " +
        "Plot Availing Construction Power, Plot Availing Permanent Water Connection, Per Plot Revenue Tax, " +
        "Trade License Data Not Integrated)"
    ),
  ],
});

const mapImagePage2 = (missionMapImg: Buffer) => {
  return new Paragraph({
    children: [
      new ImageRun({
        data: missionMapImg,
        transformation: {
          width: 350,
          height: 250,
        },
        floating: {
          horizontalPosition: {
            relative: HorizontalPositionRelativeFrom.LEFT_MARGIN,
            offset: 6650000,
          },
          verticalPosition: {
            relative: VerticalPositionRelativeFrom.TOP_MARGIN,
            offset: 2250000,
          },
        },
      }),
    ],
  });
};

const missionNameTextBox = (
  missionHeading: string,
  missionSubHeading: string
) => {
  return new Paragraph({
    frame: {
      position: {
        x: 9700,
        y: 8000,
      },
      width: 3800,
      height: 500,
      anchor: {
        horizontal: FrameAnchorType.MARGIN,
        vertical: FrameAnchorType.MARGIN,
      },
      alignment: {
        x: HorizontalPositionAlign.CENTER,
        y: VerticalPositionAlign.TOP,
      },
    },
    shading: {
      type: ShadingType.SOLID,
      color: "69C7E9",
    },
    alignment: AlignmentType.CENTER,
    children: [
      new TextRun({
        text: missionHeading,
        size: "11pt",
        bold: true,
      }),
      new TextRun({
        text: missionSubHeading,
        size: "11pt",
        bold: true,
        break: 1,
      }),
    ],
  });
};

const headingTextBox = new Paragraph({
  frame: {
    position: {
      x: 9600,
      y: 400,
    },
    width: 4200,
    height: 1600,
    anchor: {
      horizontal: FrameAnchorType.MARGIN,
      vertical: FrameAnchorType.MARGIN,
    },
    alignment: {
      x: HorizontalPositionAlign.CENTER,
      y: VerticalPositionAlign.TOP,
    },
  },
  border: {
    top: { style: BorderStyle.SINGLE, size: 20, color: "FFFFFF" },
    bottom: { style: BorderStyle.SINGLE, size: 20, color: "FFFFFF" },
    left: { style: BorderStyle.SINGLE, size: 20, color: "FFFFFF" },
    right: { style: BorderStyle.SINGLE, size: 20, color: "FFFFFF" },
  },
  alignment: AlignmentType.CENTER,
  children: [
    new TextRun({
      text: "Summary",
      size: "30pt",
      bold: true,
      font: "Arial",
      color: "4A442A",
    }),
    new TextRun({
      text: "Report",
      size: "30pt",
      bold: true,
      font: "Arial",
      color: "4A442A",
      break: 1,
    }),
  ],
});

const idTextBox = (missionCode: string) => {
  return new Paragraph({
    frame: {
      position: {
        x: 12100,
        y: 0,
      },
      width: 2000,
      height: 1500,
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
};

const designBorderTextBox = new Paragraph({
  frame: {
    position: {
      x: 11750,
      y: 1300,
    },
    width: 2100,
    height: 800,
    anchor: {
      horizontal: FrameAnchorType.MARGIN,
      vertical: FrameAnchorType.MARGIN,
    },
  },
  border: {
    bottom: { style: BorderStyle.SINGLE, size: 40, color: "69C7E9" },
    right: { style: BorderStyle.SINGLE, size: 40, color: "69C7E9" },
  },
  children: [],
});

export const page2 = (properties: IPage2Properties) => {
  const {
    missionHeading,
    missionSubHeading,
    missionCode,
    area,
    occupancy,
    missionMapImg,
  } = properties;
  return {
    properties: commonPageProperties,
    footers: commonPageFooter,
    children: [
      table1(area),
      table2(occupancy),
      textBoxBelowTable2,
      mapImagePage2(missionMapImg),
      missionNameTextBox(missionHeading, missionSubHeading),
      headingTextBox,
      idTextBox(missionCode),
      designBorderTextBox,
    ],
  };
};
