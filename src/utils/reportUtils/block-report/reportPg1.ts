import * as fs from "fs";
import {
  Paragraph,
  AlignmentType,
  TextRun,
  ImageRun,
  HorizontalPositionRelativeFrom,
  VerticalPositionRelativeFrom,
  FrameAnchorType,
  Table,
  TableRow,
  HeightRule,
  TableCell,
  VerticalAlign,
} from "docx";
import { commonPageFooter, commonPageProperties } from "../reportUtils";
import { IPage1Properties } from "./types";
import path from "path";

const NKDALogo = new Paragraph({
  children: [
    new ImageRun({
      data: fs.readFileSync(path.join(__dirname, "..", "assets", "NKDA_Logo.png")),
      transformation: {
        width: 100,
        height: 100,
      },
      floating: {
        horizontalPosition: {
          relative: HorizontalPositionRelativeFrom.LEFT_MARGIN,
          offset: 814400,
        },
        verticalPosition: {
          relative: VerticalPositionRelativeFrom.TOP_MARGIN,
          offset: 1014400,
        },
      },
    }),
  ],
});

const FSIPLLogo = new Paragraph({
  children: [
    new ImageRun({
      data: fs.readFileSync(path.join(__dirname, "..", "assets", "FSIPL_Logo.png")),
      transformation: {
        width: 110,
        height: 100,
      },
      floating: {
        horizontalPosition: {
          relative: HorizontalPositionRelativeFrom.RIGHT_MARGIN,
          // align: HorizontalPositionAlign.RIGHT,
          offset: -814400,
        },
        verticalPosition: {
          relative: VerticalPositionRelativeFrom.TOP_MARGIN,
          offset: 1014400,
        },
      },
    }),
  ],
});

const headings = (missionHeading: string, missionSubHeading: string) => {
  return new Paragraph({
    frame: {
      position: {
        x: 300,
        y: 400,
      },
      width: 50000,
      height: 1000,
      anchor: {
        horizontal: FrameAnchorType.MARGIN,
        vertical: FrameAnchorType.MARGIN,
      },
    },
    alignment: AlignmentType.CENTER,
    children: [
      new TextRun({
        text: "Geospatial Intelligence Block Report",
        color: "000000",
        size: "24pt",
        font: {
          name: "Calibri Light",
        },
      }),
      new TextRun({
        text: missionHeading,
        color: "595959",
        size: "28pt",
        font: {
          name: "Verdana",
        },
        break: 2,
      }),
      new TextRun({
        text: missionSubHeading,
        color: "4A442A",
        size: "54pt",
        font: {
          name: "Arial",
        },
        bold: true,
        break: 1,
      }),
    ],
  });
};

const missionMapImage = (missionMapImg: Buffer) => {
  return new Paragraph({
    children: [
      new ImageRun({
        data: missionMapImg,
        transformation: {
          width: 500,
          height: 365,
        },
        floating: {
          horizontalPosition: {
            relative: HorizontalPositionRelativeFrom.LEFT_MARGIN,
            offset: 814400,
          },
          verticalPosition: {
            relative: VerticalPositionRelativeFrom.TOP_MARGIN,
            offset: 3160000,
          },
        },
      }),
    ],
  });
};

const pg1Table = (
  missionSubHeading: string,
  missionDate: string,
  users: string[],
  emails: string[],
  phoneNos: string[]
) => {
  return new Table({
    width: {
      size: "11.74cm",
    },
    float: {
      absoluteHorizontalPosition: "14cm",
      absoluteVerticalPosition: "7.9cm",
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
              fill: "5B9BD5",
            },
            width: {
              size: "25%",
            },
            margins: {
              left: 100,
              right: 100,
            },
            children: [new Paragraph(missionSubHeading)],
            verticalAlign: VerticalAlign.CENTER,
          }),
          new TableCell({
            shading: {
              fill: "5B9BD5",
            },
            columnSpan: 2,
            width: {
              size: "75%",
            },
            margins: {
              left: 100,
              right: 100,
            },
            children: [new Paragraph(users.join(" & "))],
            verticalAlign: VerticalAlign.CENTER,
          }),
        ],
      }),
      new TableRow({
        height: {
          value: "3cm",
          rule: HeightRule.EXACT,
        },
        children: [
          new TableCell({
            shading: {
              fill: "5B9BD5",
            },
            width: {
              size: "25%",
            },
            margins: {
              left: 100,
              right: 100,
            },
            children: [new Paragraph(`Date: ${missionDate}`)],
            verticalAlign: VerticalAlign.CENTER,
          }),
          new TableCell({
            shading: {
              fill: "D2DEEF",
            },
            width: {
              size: "35%",
            },
            margins: {
              left: 100,
              right: 100,
            },
            children: [new Paragraph(`P: ${phoneNos.join(" & ")}`)],
            verticalAlign: VerticalAlign.CENTER,
          }),
          new TableCell({
            shading: {
              fill: "D2DEEF",
            },
            width: {
              size: "40%",
            },
            margins: {
              left: 100,
              right: 100,
            },
            children: [new Paragraph(`Y: ${emails.join("\n&\n")}`)],
            verticalAlign: VerticalAlign.CENTER,
          }),
        ],
      }),
      new TableRow({
        height: {
          value: "4.6cm",
          rule: HeightRule.EXACT,
        },
        children: [
          new TableCell({
            shading: {
              fill: "5B9BD5",
            },
            width: {
              size: "25%",
            },
            margins: {
              left: 100,
              right: 100,
            },
            children: [new Paragraph("STATEMENT OF CONFIDENTIALITY")],
            verticalAlign: VerticalAlign.CENTER,
          }),
          new TableCell({
            shading: {
              fill: "D2DEEF",
            },
            columnSpan: 2,
            width: {
              size: "75%",
            },
            margins: {
              left: 100,
              right: 100,
            },
            children: [
              new Paragraph(
                "This report is a part of an ongoing contract with Newtown Kolkata Development Authority " +
                  "and is issued for parties  under contract only. Terms and Conditions of contract " +
                  "preside over all parties and their actors."
              ),
            ],
            verticalAlign: VerticalAlign.CENTER,
          }),
        ],
      }),
    ],
  });
};

const idTextBox = (missionCode: string) => {
  return new Paragraph({
    frame: {
      position: {
        x: 12500,
        y: 2700,
      },
      width: 2250,
      height: 1000,
      anchor: {
        horizontal: FrameAnchorType.MARGIN,
        vertical: FrameAnchorType.MARGIN,
      },
    },
    children: [
      new TextRun({
        text: missionCode,
        color: "7E7E7E",
        size: "12pt",
        font: {
          name: "Arial MT",
        },
      }),
    ],
  });
};

export const page1 = (properties: IPage1Properties) => {
  const {
    missionHeading,
    missionMapImg,
    missionSubHeading,
    missionCode,
    date,
    users,
    emails,
    phoneNos,
  } = properties;
  return {
    properties: commonPageProperties,
    footers: commonPageFooter,
    children: [
      NKDALogo,
      headings(missionHeading, missionSubHeading),
      FSIPLLogo,
      missionMapImage(missionMapImg),
      pg1Table(missionSubHeading, date, users, emails, phoneNos),
      idTextBox(missionCode),
    ],
  };
};
