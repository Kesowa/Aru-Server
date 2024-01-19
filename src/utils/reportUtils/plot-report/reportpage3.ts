import { IPage3Properties } from "./types";
import {
  Paragraph,
  AlignmentType,
  TextRun,
  Table,
  TableRow,
  HeightRule,
  TableCell,
  VerticalAlign,
} from "docx";
import { commonPageFooter, commonPageProperties } from "./../reportUtils";

export const page3 = (properties: IPage3Properties) => {
  const {
    plotArea,
    plotNo,
    premiseNo,
    pincode,
    category,
    infraction,
    isGreenTopEligible,
    isSolarPlantEligible,
    hasTradeLicense,
    tax,

    buildingArea,
    buildingFootprint,
    buildingAvailable,
    floorCount,
    buildingNo,
    hasCompletionCertificate,
    buildingHeight,

    blockName,
    greeneryPercent,
    canopyPercent,
    waterbodyPercent,
    garbageCollectionInfo,
    averageBuildingHeight,
    averageBlockHeight,
    averageIncentives,
  } = properties;

  const pg1Table = () => {
    return new Table({
      alignment: AlignmentType.CENTER,
      width: {
        size: "28.59cm",
      },
      float: {
        absoluteHorizontalPosition: "-2.00cm",
        absoluteVerticalPosition: "0cm",
      },
      rows: [
        new TableRow({
          height: {
            value: "2cm",
            rule: HeightRule.EXACT,
          },
          children: [
            new TableCell({
              shading: {
                fill: "DEEBF7",
              },
              width: {
                size: "70%",
              },
              margins: {
                left: 100,
                right: 100,
              },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  // text:"Annual Invoice Commitment to Resident",
                  children: [
                    new TextRun({
                      text: "Annual Invoice Commitment to Resident",
                      bold: true,
                      // color: "FFFFFF",
                      size: "15pt",
                      // font: "Calibri",
                    }),
                    new TextRun({
                      text: `Name: `,
                      // bold: true,
                      // color: "FFFFFF",
                      size: "12pt",
                      break: 1,
                      // font: "Calibri",
                    }),
                    new TextRun({
                      text: `Address: `,
                      // bold: true,
                      // color: "FFFFFF",
                      size: "12pt",
                      break: 1,
                      // font: "Calibri",
                    }),
                  ],
                }),
              ],
              verticalAlign: VerticalAlign.CENTER,
            }),
            new TableCell({
              shading: {
                fill: "DEEBF7",
              },
              columnSpan: 2,
              width: {
                size: "30%",
              },
              margins: {
                left: 100,
                right: 100,
              },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: `Block: ${blockName}`,
                      bold: true,
                      // color: "FFFFFF",
                      size: "15pt",
                      // font: "Calibri",
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
            value: "1cm",
            rule: HeightRule.EXACT,
          },
          children: [
            new TableCell({
              shading: {
                fill: "52AAC6",
              },
              width: {
                size: "100%",
              },
              columnSpan: 3,
              margins: {
                left: 100,
                right: 100,
              },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  // text:"Annual Invoice Commitment to Resident",
                  children: [
                    new TextRun({
                      text: "Plot Data",
                      bold: true,
                      color: "000000",
                      size: "15pt",
                      // font: "Calibri",
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
            value: "0.6cm",
            rule: HeightRule.EXACT,
          },
          children: [
            new TableCell({
              shading: {
                fill: "ffffff",
              },
              width: {
                size: "45%",
              },
              margins: {
                left: 100,
                right: 100,
              },

              children: [
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  children: [
                    new TextRun({
                      text: `Plot No:`,
                      // bold: true,
                      color: "000000",
                      size: "12pt",
                      // font: "Calibri",
                    }),
                  ],
                }),
              ],
              verticalAlign: VerticalAlign.CENTER,
            }),
            new TableCell({
              shading: {
                fill: "ffffff",
              },

              width: {
                size: "55%",
              },
              columnSpan: 2,
              margins: {
                left: 100,
                right: 100,
              },

              //   borders: {
              //     right: {
              //         style: BorderStyle.DASH_DOT_STROKED,
              //         size: 3,
              //         color: "#ff8000",
              //     },
              // },
              children: [
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  children: [
                    new TextRun({
                      text: `${plotNo}`,
                      // bold: true,
                      color: "000000",
                      size: "12pt",
                      // font: "Calibri",
                    }),
                  ],
                }),
              ],
              verticalAlign: VerticalAlign.CENTER,
            }),
          ],
        }), //1
        new TableRow({
          height: {
            value: "0.6cm",
            rule: HeightRule.EXACT,
          },
          children: [
            new TableCell({
              shading: {
                fill: "ffffff",
              },
              width: {
                size: "45%",
              },
              margins: {
                left: 100,
                right: 100,
              },

              children: [
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  children: [
                    new TextRun({
                      text: `Premises No:`,
                      // bold: true,
                      color: "000000",
                      size: "12pt",
                      // font: "Calibri",
                    }),
                  ],
                }),
              ],
              verticalAlign: VerticalAlign.CENTER,
            }),
            new TableCell({
              shading: {
                fill: "ffffff",
              },

              width: {
                size: "55%",
              },
              columnSpan: 2,
              margins: {
                left: 100,
                right: 100,
              },
              //   borders: {
              //     right: {
              //         style: BorderStyle.DASH_DOT_STROKED,
              //         size: 3,
              //         color: "#ff8000",
              //     },
              // },
              children: [
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  children: [
                    new TextRun({
                      text: `${premiseNo}`,
                      // bold: true,
                      color: "000000",
                      size: "12pt",
                      // font: "Calibri",
                    }),
                  ],
                }),
              ],
              verticalAlign: VerticalAlign.CENTER,
            }),
          ],
        }), //2
        new TableRow({
          height: {
            value: "0.6cm",
            rule: HeightRule.EXACT,
          },
          children: [
            new TableCell({
              shading: {
                fill: "ffffff",
              },
              width: {
                size: "45%",
              },
              margins: {
                left: 100,
                right: 100,
              },

              children: [
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  children: [
                    new TextRun({
                      text: `Plot Area (sq. m):`,
                      // bold: true,
                      color: "000000",
                      size: "12pt",
                      // font: "Calibri",
                    }),
                  ],
                }),
              ],
              verticalAlign: VerticalAlign.CENTER,
            }),
            new TableCell({
              shading: {
                fill: "ffffff",
              },

              width: {
                size: "55%",
              },
              columnSpan: 2,
              margins: {
                left: 100,
                right: 100,
              },
              //   borders: {
              //     right: {
              //         style: BorderStyle.DASH_DOT_STROKED,
              //         size: 3,
              //         color: "#ff8000",
              //     },
              // },
              children: [
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  children: [
                    new TextRun({
                      text: `${plotArea}`,
                      // bold: true,
                      color: "000000",
                      size: "12pt",
                      // font: "Calibri",
                    }),
                  ],
                }),
              ],
              verticalAlign: VerticalAlign.CENTER,
            }),
          ],
        }), //3
        new TableRow({
          height: {
            value: "0.6cm",
            rule: HeightRule.EXACT,
          },
          children: [
            new TableCell({
              shading: {
                fill: "ffffff",
              },
              width: {
                size: "45%",
              },
              margins: {
                left: 100,
                right: 100,
              },

              children: [
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  children: [
                    new TextRun({
                      text: `Building Available`,
                      // bold: true,
                      color: "000000",
                      size: "12pt",
                      // font: "Calibri",
                    }),
                  ],
                }),
              ],
              verticalAlign: VerticalAlign.CENTER,
            }),
            new TableCell({
              shading: {
                fill: "ffffff",
              },

              width: {
                size: "55%",
              },
              columnSpan: 2,
              margins: {
                left: 100,
                right: 100,
              },
              //   borders: {
              //     right: {
              //         style: BorderStyle.DASH_DOT_STROKED,
              //         size: 3,
              //         color: "#ff8000",
              //     },
              // },
              children: [
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  children: [
                    new TextRun({
                      text: `${buildingAvailable ? "Yes" : "No"}`,
                      // bold: true,
                      color: "000000",
                      size: "12pt",
                      // font: "Calibri",
                    }),
                  ],
                }),
              ],
              verticalAlign: VerticalAlign.CENTER,
            }),
          ],
        }), //4
        new TableRow({
          height: {
            value: "0.6cm",
            rule: HeightRule.EXACT,
          },
          children: [
            new TableCell({
              shading: {
                fill: "ffffff",
              },
              width: {
                size: "45%",
              },
              margins: {
                left: 100,
                right: 100,
              },

              children: [
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  children: [
                    new TextRun({
                      text: `Pin code`,
                      // bold: true,
                      color: "000000",
                      size: "12pt",
                      // font: "Calibri",
                    }),
                  ],
                }),
              ],
              verticalAlign: VerticalAlign.CENTER,
            }),
            new TableCell({
              shading: {
                fill: "ffffff",
              },

              width: {
                size: "55%",
              },
              columnSpan: 2,
              margins: {
                left: 100,
                right: 100,
              },
              //   borders: {
              //     right: {
              //         style: BorderStyle.DASH_DOT_STROKED,
              //         size: 3,
              //         color: "#ff8000",
              //     },
              // },
              children: [
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  children: [
                    new TextRun({
                      text: `${pincode}`,
                      // bold: true,
                      color: "000000",
                      size: "12pt",
                      // font: "Calibri",
                    }),
                  ],
                }),
              ],
              verticalAlign: VerticalAlign.CENTER,
            }),
          ],
        }), //5
        new TableRow({
          height: {
            value: "0.6cm",
            rule: HeightRule.EXACT,
          },
          children: [
            new TableCell({
              shading: {
                fill: "ffffff",
              },
              width: {
                size: "45%",
              },
              margins: {
                left: 100,
                right: 100,
              },

              children: [
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  children: [
                    new TextRun({
                      text: `Plot Category`,
                      // bold: true,
                      color: "000000",
                      size: "12pt",
                      // font: "Calibri",
                    }),
                  ],
                }),
              ],
              verticalAlign: VerticalAlign.CENTER,
            }),
            new TableCell({
              shading: {
                fill: "ffffff",
              },

              width: {
                size: "55%",
              },
              columnSpan: 2,
              margins: {
                left: 100,
                right: 100,
              },
              //   borders: {
              //     right: {
              //         style: BorderStyle.DASH_DOT_STROKED,
              //         size: 3,
              //         color: "#ff8000",
              //     },
              // },
              children: [
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  children: [
                    new TextRun({
                      text: `${category}`,
                      // bold: true,
                      color: "000000",
                      size: "12pt",
                      // font: "Calibri",
                    }),
                  ],
                }),
              ],
              verticalAlign: VerticalAlign.CENTER,
            }),
          ],
        }), //6
        new TableRow({
          height: {
            value: "0.6cm",
            rule: HeightRule.EXACT,
          },
          children: [
            new TableCell({
              shading: {
                fill: "ffffff",
              },
              width: {
                size: "45%",
              },
              margins: {
                left: 100,
                right: 100,
              },

              children: [
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  children: [
                    new TextRun({
                      text: `No. of Floor`,
                      // bold: true,
                      color: "000000",
                      size: "12pt",
                      // font: "Calibri",
                    }),
                  ],
                }),
              ],
              verticalAlign: VerticalAlign.CENTER,
            }),
            new TableCell({
              shading: {
                fill: "ffffff",
              },

              width: {
                size: "55%",
              },
              columnSpan: 2,
              margins: {
                left: 100,
                right: 100,
              },
              //   borders: {
              //     right: {
              //         style: BorderStyle.DASH_DOT_STROKED,
              //         size: 3,
              //         color: "#ff8000",
              //     },
              // },
              children: [
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  children: [
                    new TextRun({
                      text: `${floorCount}`,
                      // bold: true,
                      color: "000000",
                      size: "12pt",
                      // font: "Calibri",
                    }),
                  ],
                }),
              ],
              verticalAlign: VerticalAlign.CENTER,
            }),
          ],
        }), //7
        new TableRow({
          height: {
            value: "0.6cm",
            rule: HeightRule.EXACT,
          },
          children: [
            new TableCell({
              shading: {
                fill: "ffffff",
              },
              width: {
                size: "45%",
              },
              margins: {
                left: 100,
                right: 100,
              },

              children: [
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  children: [
                    new TextRun({
                      text: `Sanctioned Building No.`,
                      // bold: true,
                      color: "000000",
                      size: "12pt",
                      // font: "Calibri",
                    }),
                  ],
                }),
              ],
              verticalAlign: VerticalAlign.CENTER,
            }),
            new TableCell({
              shading: {
                fill: "ffffff",
              },

              width: {
                size: "55%",
              },
              columnSpan: 2,
              margins: {
                left: 100,
                right: 100,
              },
              //   borders: {
              //     right: {
              //         style: BorderStyle.DASH_DOT_STROKED,
              //         size: 3,
              //         color: "#ff8000",
              //     },
              // },
              children: [
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  children: [
                    new TextRun({
                      text: `${buildingNo}`,
                      // bold: true,
                      color: "000000",
                      size: "12pt",
                      // font: "Calibri",
                    }),
                  ],
                }),
              ],
              verticalAlign: VerticalAlign.CENTER,
            }),
          ],
        }), //8
        new TableRow({
          height: {
            value: "0.6cm",
            rule: HeightRule.EXACT,
          },
          children: [
            new TableCell({
              shading: {
                fill: "ffffff",
              },
              width: {
                size: "45%",
              },
              margins: {
                left: 100,
                right: 100,
              },

              children: [
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  children: [
                    new TextRun({
                      text: `Building Area (sq. m)`,
                      // bold: true,
                      color: "000000",
                      size: "12pt",
                      // font: "Calibri",
                    }),
                  ],
                }),
              ],
              verticalAlign: VerticalAlign.CENTER,
            }),
            new TableCell({
              shading: {
                fill: "ffffff",
              },

              width: {
                size: "55%",
              },
              columnSpan: 2,
              margins: {
                left: 100,
                right: 100,
              },
              //   borders: {
              //     right: {
              //         style: BorderStyle.DASH_DOT_STROKED,
              //         size: 3,
              //         color: "#ff8000",
              //     },
              // },
              children: [
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  children: [
                    new TextRun({
                      text: `${buildingArea}`,
                      // bold: true,
                      color: "000000",
                      size: "12pt",
                      // font: "Calibri",
                    }),
                  ],
                }),
              ],
              verticalAlign: VerticalAlign.CENTER,
            }),
          ],
        }), //9
        new TableRow({
          height: {
            value: "0.6cm",
            rule: HeightRule.EXACT,
          },
          children: [
            new TableCell({
              shading: {
                fill: "ffffff",
              },
              width: {
                size: "45%",
              },
              margins: {
                left: 100,
                right: 100,
              },

              children: [
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  children: [
                    new TextRun({
                      text: `Building Footprint`,
                      // bold: true,
                      color: "000000",
                      size: "12pt",
                      // font: "Calibri",
                    }),
                  ],
                }),
              ],
              verticalAlign: VerticalAlign.CENTER,
            }),
            new TableCell({
              shading: {
                fill: "ffffff",
              },

              width: {
                size: "55%",
              },
              columnSpan: 2,
              margins: {
                left: 100,
                right: 100,
              },
              //   borders: {
              //     right: {
              //         style: BorderStyle.DASH_DOT_STROKED,
              //         size: 3,
              //         color: "#ff8000",
              //     },
              // },
              children: [
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  children: [
                    new TextRun({
                      text: `${buildingFootprint} %`,
                      // bold: true,
                      color: "000000",
                      size: "12pt",
                      // font: "Calibri",
                    }),
                  ],
                }),
              ],
              verticalAlign: VerticalAlign.CENTER,
            }),
          ],
        }), //10
        new TableRow({
          height: {
            value: "0.6cm",
            rule: HeightRule.EXACT,
          },
          children: [
            new TableCell({
              shading: {
                fill: "ffffff",
              },
              width: {
                size: "45%",
              },
              margins: {
                left: 100,
                right: 100,
              },

              children: [
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  children: [
                    new TextRun({
                      text: `Completion Certificate`,
                      // bold: true,
                      color: "000000",
                      size: "12pt",
                      // font: "Calibri",
                    }),
                  ],
                }),
              ],
              verticalAlign: VerticalAlign.CENTER,
            }),
            new TableCell({
              shading: {
                fill: "ffffff",
              },

              width: {
                size: "55%",
              },
              columnSpan: 2,
              margins: {
                left: 100,
                right: 100,
              },
              //   borders: {
              //     right: {
              //         style: BorderStyle.DASH_DOT_STROKED,
              //         size: 3,
              //         color: "#ff8000",
              //     },
              // },
              children: [
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  children: [
                    new TextRun({
                      text: `${hasCompletionCertificate ? "Yes" : "No"}`,
                      // bold: true,
                      color: "000000",
                      size: "12pt",
                      // font: "Calibri",
                    }),
                  ],
                }),
              ],
              verticalAlign: VerticalAlign.CENTER,
            }),
          ],
        }), //11
        new TableRow({
          height: {
            value: "0.6cm",
            rule: HeightRule.EXACT,
          },
          children: [
            new TableCell({
              shading: {
                fill: "ffffff",
              },
              width: {
                size: "45%",
              },
              margins: {
                left: 100,
                right: 100,
              },

              children: [
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  children: [
                    new TextRun({
                      text: `Average Building Height`,
                      // bold: true,
                      color: "000000",
                      size: "12pt",
                      // font: "Calibri",
                    }),
                  ],
                }),
              ],
              verticalAlign: VerticalAlign.CENTER,
            }),
            new TableCell({
              shading: {
                fill: "ffffff",
              },

              width: {
                size: "55%",
              },
              columnSpan: 2,
              margins: {
                left: 100,
                right: 100,
              },
              //   borders: {
              //     right: {
              //         style: BorderStyle.DASH_DOT_STROKED,
              //         size: 3,
              //         color: "#ff8000",
              //     },
              // },
              children: [
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  children: [
                    new TextRun({
                      text: `${buildingHeight}`,
                      // bold: true,
                      color: "000000",
                      size: "12pt",
                      // font: "Calibri",
                    }),
                  ],
                }),
              ],
              verticalAlign: VerticalAlign.CENTER,
            }),
          ],
        }), //12
        new TableRow({
          height: {
            value: "0.6cm",
            rule: HeightRule.EXACT,
          },
          children: [
            new TableCell({
              shading: {
                fill: "ffffff",
              },
              width: {
                size: "45%",
              },
              margins: {
                left: 100,
                right: 100,
              },

              children: [
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  children: [
                    new TextRun({
                      text: `infraction`,
                      // bold: true,
                      color: "000000",
                      size: "12pt",
                      // font: "Calibri",
                    }),
                  ],
                }),
              ],
              verticalAlign: VerticalAlign.CENTER,
            }),
            new TableCell({
              shading: {
                fill: "ffffff",
              },

              width: {
                size: "55%",
              },
              columnSpan: 2,
              margins: {
                left: 100,
                right: 100,
              },
              //   borders: {
              //     right: {
              //         style: BorderStyle.DASH_DOT_STROKED,
              //         size: 3,
              //         color: "#ff8000",
              //     },
              // },
              children: [
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  children: [
                    new TextRun({
                      text: `${infraction}`,
                      // bold: true,
                      color: "000000",
                      size: "12pt",
                      // font: "Calibri",
                    }),
                  ],
                }),
              ],
              verticalAlign: VerticalAlign.CENTER,
            }),
          ],
        }), //13
        new TableRow({
          height: {
            value: "0.6cm",
            rule: HeightRule.EXACT,
          },
          children: [
            new TableCell({
              shading: {
                fill: "ffffff",
              },
              width: {
                size: "45%",
              },
              margins: {
                left: 100,
                right: 100,
              },

              children: [
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  children: [
                    new TextRun({
                      text: `Eligible For Green Top / Solar Plant Incentives`,
                      // bold: true,
                      color: "000000",
                      size: "12pt",
                      // font: "Calibri",
                    }),
                  ],
                }),
              ],
              verticalAlign: VerticalAlign.CENTER,
            }),
            new TableCell({
              shading: {
                fill: "ffffff",
              },

              width: {
                size: "55%",
              },
              columnSpan: 2,
              margins: {
                left: 100,
                right: 100,
              },
              //   borders: {
              //     right: {
              //         style: BorderStyle.DASH_DOT_STROKED,
              //         size: 3,
              //         color: "#ff8000",
              //     },
              // },
              children: [
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  children: [
                    new TextRun({
                      text: `${isGreenTopEligible ? "Yes" : "No"} / ${
                        isSolarPlantEligible ? "Yes" : "No"
                      }`,
                      // bold: true,
                      color: "000000",
                      size: "12pt",
                      // font: "Calibri",
                    }),
                  ],
                }),
              ],
              verticalAlign: VerticalAlign.CENTER,
            }),
          ],
        }), //14
        new TableRow({
          height: {
            value: "0.6cm",
            rule: HeightRule.EXACT,
          },
          children: [
            new TableCell({
              shading: {
                fill: "ffffff",
              },
              width: {
                size: "45%",
              },
              margins: {
                left: 100,
                right: 100,
              },

              children: [
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  children: [
                    new TextRun({
                      text: `Trade License`,
                      // bold: true,
                      color: "000000",
                      size: "12pt",
                      // font: "Calibri",
                    }),
                  ],
                }),
              ],
              verticalAlign: VerticalAlign.CENTER,
            }),
            new TableCell({
              shading: {
                fill: "ffffff",
              },

              width: {
                size: "55%",
              },
              columnSpan: 2,
              margins: {
                left: 100,
                right: 100,
              },
              //   borders: {
              //     right: {
              //         style: BorderStyle.DASH_DOT_STROKED,
              //         size: 3,
              //         color: "#ff8000",
              //     },
              // },
              children: [
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  children: [
                    new TextRun({
                      text: `${hasTradeLicense ? "Yes" : "No"}`,
                      // bold: true,
                      color: "000000",
                      size: "12pt",
                      // font: "Calibri",
                    }),
                  ],
                }),
              ],
              verticalAlign: VerticalAlign.CENTER,
            }),
          ],
        }), //15
        new TableRow({
          height: {
            value: "0.6cm",
            rule: HeightRule.EXACT,
          },
          children: [
            new TableCell({
              shading: {
                fill: "ffffff",
              },
              width: {
                size: "45%",
              },
              margins: {
                left: 100,
                right: 100,
              },

              children: [
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  children: [
                    new TextRun({
                      text: `Property Tax`,
                      // bold: true,
                      color: "000000",
                      size: "12pt",
                      // font: "Calibri",
                    }),
                  ],
                }),
              ],
              verticalAlign: VerticalAlign.CENTER,
            }),
            new TableCell({
              shading: {
                fill: "ffffff",
              },

              width: {
                size: "55%",
              },
              columnSpan: 2,
              margins: {
                left: 100,
                right: 100,
              },
              //   borders: {
              //     right: {
              //         style: BorderStyle.DASH_DOT_STROKED,
              //         size: 3,
              //         color: "#ff8000",
              //     },
              // },
              children: [
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  children: [
                    new TextRun({
                      text: `${tax}`,
                      // bold: true,
                      color: "000000",
                      size: "12pt",
                      // font: "Calibri",
                    }),
                  ],
                }),
              ],
              verticalAlign: VerticalAlign.CENTER,
            }),
          ],
        }), //16
        new TableRow({
          height: {
            value: "1cm",
            rule: HeightRule.EXACT,
          },
          children: [
            new TableCell({
              shading: {
                fill: "52AAC6",
              },
              width: {
                size: "100%",
              },
              columnSpan: 4,
              margins: {
                left: 100,
                right: 100,
              },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  // text:"Annual Invoice Commitment to Resident",
                  children: [
                    new TextRun({
                      text: "Block Data",
                      bold: true,
                      color: "000000",
                      size: "15pt",
                      // font: "Calibri",
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
            value: "0.6cm",
            rule: HeightRule.EXACT,
          },
          children: [
            new TableCell({
              shading: {
                fill: "ffffff",
              },
              width: {
                size: "45%",
              },
              margins: {
                left: 100,
                right: 100,
              },

              children: [
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  children: [
                    new TextRun({
                      text: `Garbage Collector Information`,
                      // bold: true,
                      color: "000000",
                      size: "12pt",
                      // font: "Calibri",
                    }),
                  ],
                }),
              ],
              verticalAlign: VerticalAlign.CENTER,
            }),
            new TableCell({
              shading: {
                fill: "ffffff",
              },

              width: {
                size: "55%",
              },
              columnSpan: 2,
              margins: {
                left: 100,
                right: 100,
              },
              //   borders: {
              //     right: {
              //         style: BorderStyle.DASH_DOT_STROKED,
              //         size: 3,
              //         color: "#ff8000",
              //     },
              // },
              children: [
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  children: [
                    new TextRun({
                      text: `${garbageCollectionInfo}`,
                      // bold: true,
                      color: "000000",
                      size: "12pt",
                      // font: "Calibri",
                    }),
                  ],
                }),
              ],
              verticalAlign: VerticalAlign.CENTER,
            }),
          ],
        }), //17
        new TableRow({
          height: {
            value: "0.6cm",
            rule: HeightRule.EXACT,
          },
          children: [
            new TableCell({
              shading: {
                fill: "ffffff",
              },
              width: {
                size: "45%",
              },
              margins: {
                left: 100,
                right: 100,
              },

              children: [
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  children: [
                    new TextRun({
                      text: `Average Building Height`,
                      // bold: true,
                      color: "000000",
                      size: "12pt",
                      // font: "Calibri",
                    }),
                  ],
                }),
              ],
              verticalAlign: VerticalAlign.CENTER,
            }),
            new TableCell({
              shading: {
                fill: "ffffff",
              },

              width: {
                size: "55%",
              },
              columnSpan: 2,
              margins: {
                left: 100,
                right: 100,
              },
              //   borders: {
              //     right: {
              //         style: BorderStyle.DASH_DOT_STROKED,
              //         size: 3,
              //         color: "#ff8000",
              //     },
              // },
              children: [
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  children: [
                    new TextRun({
                      text: `${averageBuildingHeight}`,
                      // bold: true,
                      color: "000000",
                      size: "12pt",
                      // font: "Calibri",
                    }),
                  ],
                }),
              ],
              verticalAlign: VerticalAlign.CENTER,
            }),
          ],
        }), //18
        new TableRow({
          height: {
            value: "0.6cm",
            rule: HeightRule.EXACT,
          },
          children: [
            new TableCell({
              shading: {
                fill: "ffffff",
              },
              width: {
                size: "45%",
              },
              margins: {
                left: 100,
                right: 100,
              },

              children: [
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  children: [
                    new TextRun({
                      text: `Average Block Height`,
                      // bold: true,
                      color: "000000",
                      size: "12pt",
                      // font: "Calibri",
                    }),
                  ],
                }),
              ],
              verticalAlign: VerticalAlign.CENTER,
            }),
            new TableCell({
              shading: {
                fill: "ffffff",
              },

              width: {
                size: "55%",
              },
              columnSpan: 2,
              margins: {
                left: 100,
                right: 100,
              },
              //   borders: {
              //     right: {
              //         style: BorderStyle.DASH_DOT_STROKED,
              //         size: 3,
              //         color: "#ff8000",
              //     },
              // },
              children: [
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  children: [
                    new TextRun({
                      text: `${averageBlockHeight}`,
                      // bold: true,
                      color: "000000",
                      size: "12pt",
                      // font: "Calibri",
                    }),
                  ],
                }),
              ],
              verticalAlign: VerticalAlign.CENTER,
            }),
          ],
        }), //19
        new TableRow({
          height: {
            value: "0.6cm",
            rule: HeightRule.EXACT,
          },
          children: [
            new TableCell({
              shading: {
                fill: "ffffff",
              },
              width: {
                size: "45%",
              },
              margins: {
                left: 100,
                right: 100,
              },

              children: [
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  children: [
                    new TextRun({
                      text: `Average Incentives`,
                      // bold: true,
                      color: "000000",
                      size: "12pt",
                      // font: "Calibri",
                    }),
                  ],
                }),
              ],
              verticalAlign: VerticalAlign.CENTER,
            }),
            new TableCell({
              shading: {
                fill: "ffffff",
              },

              width: {
                size: "55%",
              },
              columnSpan: 2,
              margins: {
                left: 100,
                right: 100,
              },
              //   borders: {
              //     right: {
              //         style: BorderStyle.DASH_DOT_STROKED,
              //         size: 3,
              //         color: "#ff8000",
              //     },
              // },
              children: [
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  children: [
                    new TextRun({
                      text: `${averageIncentives}`,
                      // bold: true,
                      color: "000000",
                      size: "12pt",
                      // font: "Calibri",
                    }),
                  ],
                }),
              ],
              verticalAlign: VerticalAlign.CENTER,
            }),
          ],
        }), //20
        new TableRow({
          height: {
            value: "2.5cm",
            rule: HeightRule.EXACT,
          },
          children: [
            new TableCell({
              shading: {
                fill: "FFFFFF",
              },
              width: {
                size: "70%",
              },
              columnSpan: 1,
              margins: {
                left: 100,
                right: 100,
              },
              children: [
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  // text:"Annual Invoice Commitment to Resident",
                  children: [
                    new TextRun({
                      text: "Block Insights",
                      bold: true,
                      // color: "FFFFFF",
                      size: "15pt",
                      // font: "Calibri",
                    }),
                  ],
                }),
              ],
              verticalAlign: VerticalAlign.CENTER,
            }),
            new TableCell({
              shading: {
                fill: "FFFFFF",
              },
              columnSpan: 1,
              width: {
                size: "30%",
              },
              // margins: {
              //   left: 100,
              //   right: 100,
              // },
              children: [
                new Table({
                  // alignment: AlignmentType.CENTER,
                  rows: [
                    new TableRow({
                      height: {
                        value: "0.6cm",
                        rule: HeightRule.EXACT,
                      },
                      children: [
                        new TableCell({
                          shading: {
                            fill: "ffffff",
                          },
                          width: {
                            size: "45%",
                          },
                          margins: {
                            left: 100,
                            right: 100,
                          },

                          children: [
                            new Paragraph({
                              alignment: AlignmentType.LEFT,
                              children: [
                                new TextRun({
                                  text: ``,
                                  // bold: true,
                                  color: "000000",
                                  size: "12pt",
                                  // font: "Calibri",
                                }),
                              ],
                            }),
                          ],
                          verticalAlign: VerticalAlign.CENTER,
                        }),
                        new TableCell({
                          shading: {
                            fill: "ffffff",
                          },

                          width: {
                            size: "55%",
                          },
                          columnSpan: 2,
                          margins: {
                            left: 100,
                            right: 100,
                          },
                          //   borders: {
                          //     right: {
                          //         style: BorderStyle.DASH_DOT_STROKED,
                          //         size: 3,
                          //         color: "#ff8000",
                          //     },
                          // },
                          children: [
                            new Paragraph({
                              alignment: AlignmentType.LEFT,
                              children: [
                                new TextRun({
                                  text: ``,
                                  // bold: true,
                                  color: "000000",
                                  size: "12pt",
                                  // font: "Calibri",
                                }),
                              ],
                            }),
                          ],
                          verticalAlign: VerticalAlign.CENTER,
                        }),
                      ],
                    }), //1
                    new TableRow({
                      height: {
                        value: "0.6cm",
                        rule: HeightRule.EXACT,
                      },
                      children: [
                        new TableCell({
                          shading: {
                            fill: "ffffff",
                          },
                          width: {
                            size: "45%",
                          },
                          margins: {
                            left: 100,
                            right: 100,
                          },

                          children: [
                            new Paragraph({
                              alignment: AlignmentType.LEFT,
                              children: [
                                new TextRun({
                                  text: `Water`,
                                  // bold: true,
                                  color: "000000",
                                  size: "12pt",
                                  // font: "Calibri",
                                }),
                              ],
                            }),
                          ],
                          verticalAlign: VerticalAlign.CENTER,
                        }),
                        new TableCell({
                          shading: {
                            fill: "ffffff",
                          },

                          width: {
                            size: "55%",
                          },
                          columnSpan: 2,
                          margins: {
                            left: 100,
                            right: 100,
                          },

                          children: [
                            new Paragraph({
                              alignment: AlignmentType.LEFT,
                              children: [
                                new TextRun({
                                  text: `${waterbodyPercent} %`,
                                  // bold: true,
                                  color: "000000",
                                  size: "12pt",
                                  // font: "Calibri",
                                }),
                              ],
                            }),
                          ],
                          verticalAlign: VerticalAlign.CENTER,
                        }),
                      ],
                    }), //2
                    new TableRow({
                      height: {
                        value: "0.6cm",
                        rule: HeightRule.EXACT,
                      },
                      children: [
                        new TableCell({
                          shading: {
                            fill: "ffffff",
                          },
                          width: {
                            size: "45%",
                          },
                          margins: {
                            left: 100,
                            right: 100,
                          },

                          children: [
                            new Paragraph({
                              alignment: AlignmentType.LEFT,
                              children: [
                                new TextRun({
                                  text: `Green`,
                                  // bold: true,
                                  color: "000000",
                                  size: "12pt",
                                  // font: "Calibri",
                                }),
                              ],
                            }),
                          ],
                          verticalAlign: VerticalAlign.CENTER,
                        }),
                        new TableCell({
                          shading: {
                            fill: "ffffff",
                          },

                          width: {
                            size: "55%",
                          },
                          columnSpan: 2,
                          margins: {
                            left: 100,
                            right: 100,
                          },
                          //   borders: {
                          //     right: {
                          //         style: BorderStyle.DASH_DOT_STROKED,
                          //         size: 3,
                          //         color: "#ff8000",
                          //     },
                          // },
                          children: [
                            new Paragraph({
                              alignment: AlignmentType.LEFT,
                              children: [
                                new TextRun({
                                  text: `${greeneryPercent} %`,
                                  // bold: true,
                                  color: "000000",
                                  size: "12pt",
                                  // font: "Calibri",
                                }),
                              ],
                            }),
                          ],
                          verticalAlign: VerticalAlign.CENTER,
                        }),
                      ],
                    }), //3
                    new TableRow({
                      height: {
                        value: "0.6cm",
                        rule: HeightRule.EXACT,
                      },
                      children: [
                        new TableCell({
                          shading: {
                            fill: "ffffff",
                          },
                          width: {
                            size: "45%",
                          },
                          margins: {
                            left: 100,
                            right: 100,
                          },

                          children: [
                            new Paragraph({
                              alignment: AlignmentType.LEFT,
                              children: [
                                new TextRun({
                                  text: `Tree Canopy`,
                                  // bold: true,
                                  color: "000000",
                                  size: "12pt",
                                  // font: "Calibri",
                                }),
                              ],
                            }),
                          ],
                          verticalAlign: VerticalAlign.CENTER,
                        }),
                        new TableCell({
                          shading: {
                            fill: "ffffff",
                          },

                          width: {
                            size: "55%",
                          },
                          columnSpan: 2,
                          margins: {
                            left: 100,
                            right: 100,
                          },
                          //   borders: {
                          //     right: {
                          //         style: BorderStyle.DASH_DOT_STROKED,
                          //         size: 3,
                          //         color: "#ff8000",
                          //     },
                          // },
                          children: [
                            new Paragraph({
                              alignment: AlignmentType.LEFT,
                              children: [
                                new TextRun({
                                  text: `${canopyPercent} %`,
                                  // bold: true,
                                  color: "000000",
                                  size: "12pt",
                                  // font: "Calibri",
                                }),
                              ],
                            }),
                          ],
                          verticalAlign: VerticalAlign.CENTER,
                        }),
                      ],
                    }), //4
                  ],
                }),
              ],
              verticalAlign: VerticalAlign.CENTER,
            }),
          ],
        }),
        new TableRow({
          height: {
            value: "2cm",
            rule: HeightRule.EXACT,
          },
          children: [
            new TableCell({
              shading: {
                fill: "52AAC6",
              },
              width: {
                size: "100%",
              },
              columnSpan: 3,
              margins: {
                left: 100,
                right: 100,
              },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  // text:"Annual Invoice Commitment to Resident",
                  children: [
                    new TextRun({
                      text: "Block Announcement",
                      bold: true,
                      color: "000000",
                      size: "15pt",
                      // font: "Calibri",
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
  };

  return {
    properties: commonPageProperties,
    footers: commonPageFooter,
    children: [pg1Table()],
  };
};
