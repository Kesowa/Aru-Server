import { IPage1Properties } from "./types";
import fs from "fs";
import path from "path";
import {
  Paragraph,
  AlignmentType,
  TextRun,
  ImageRun,
  HorizontalPositionRelativeFrom,
  VerticalPositionRelativeFrom,
  FrameAnchorType,
} from "docx";
import { commonPageFooter, commonPageProperties } from "./../reportUtils";

const NKDALogo = new Paragraph({
  children: [
    new ImageRun({
      data: fs.readFileSync(path.join(__dirname, "..", "assets", "NKDA_Logo.png")),
      transformation: {
        width: 70,
        height: 70,
      },
      floating: {
        horizontalPosition: {
          relative: HorizontalPositionRelativeFrom.RIGHT_MARGIN,
          offset: 0,
        },
        verticalPosition: {
          relative: VerticalPositionRelativeFrom.TOP_MARGIN,
          offset: 300000,
        },
      },
    }),
  ],
});

const missionDetail = new Paragraph({
  frame: {
    position: {
      x: 1000,
      y: 8400,
    },
    width: 5000,
    height: 500,
    anchor: {
      horizontal: FrameAnchorType.MARGIN,
      vertical: FrameAnchorType.MARGIN,
    },
  },
  children:[
    new TextRun({
      text: "This report is a part of an ongoing contract with Newtown Kolkata Development Authority and is issued for parties under contract only. " + 
            " Terms and Conditions of contract preside over all parties and their actors.",
      color: "4A442A",
      font: {
        name: "Arial",
      },
    })
  ]
});

const headings = (blockName: string) => {
  return new Paragraph({
    frame: {
      position: {
        x: 2000,
        y: 400,
      },
      width: 10000,
      height: 500,
      anchor: {
        horizontal: FrameAnchorType.MARGIN,
        vertical: FrameAnchorType.MARGIN,
      },
    },
    alignment: AlignmentType.CENTER,
    children: [
      new TextRun({
        text: `${blockName} - Plot Report Factoring in NKDA Occupancy Data`,
        color: "000000",
        size: "28pt",
        bold: true,
        font: {
          name: "Calibri Light",
        },
        underline: {
          color: "000000",
        },
      }),
    ],
  });
};

const frontImg = (coverImageBuffer: Buffer) => {
  return new Paragraph({
    children: [
      new ImageRun({
        data: coverImageBuffer,
        transformation: {
          width: 850,
          height: 380,
        },
        floating: {
          horizontalPosition: {
            relative: HorizontalPositionRelativeFrom.LEFT_MARGIN,
            offset: 1394400,
          },
          verticalPosition: {
            relative: VerticalPositionRelativeFrom.TOP_MARGIN,
            offset: 1790000,
          },
        },
      }),
    ],
  });
};

const missionEmail = (users: string[], date: string) => {
  return  new  Paragraph({
    frame: {
      position: {
        x: 5000,
        y: 9400,
      },
      width: 10000,
      height: 500,
      anchor: {
        horizontal: FrameAnchorType.MARGIN,
        vertical: FrameAnchorType.MARGIN,
      },
    },
    alignment: AlignmentType.END,
    children:[
      new TextRun({
        text: `${users.join(" & ")}`,
        color: "4A442A",
        font: {
          name: "Arial",
        },
      }),
      new TextRun({
        text: `dt ${date}`,
        color: "4A442A",
        font: {
          name: "Arial",
        },
        break: 1,
      }),
      new TextRun({
        break: 2,
      }),
      new ImageRun({
        data: fs.readFileSync(path.join(__dirname, "..", "assets", "FSIPL_Logo.png")),
        transformation: {
          width: 50,
          height: 50,
        },
      }),
    ]
  });
}

export const page1 = (properties: IPage1Properties) => {
  const {
    blockName,
    coverImageBuffer,
    date,
    users,
  } = properties;

  return {
    properties: commonPageProperties,
    footers: commonPageFooter,
    children: [
      NKDALogo,
      headings(blockName),
      frontImg(coverImageBuffer),
      missionDetail,
      missionEmail(users, date),
    ],
  };
};
