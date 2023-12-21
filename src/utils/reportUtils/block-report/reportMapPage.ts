import {
  Paragraph,
  FrameAnchorType,
  ShadingType,
  ImageRun,
  HorizontalPositionRelativeFrom,
  VerticalPositionRelativeFrom,
  AlignmentType,
  TextRun,
} from "docx";
import * as fs from "fs";
import path from "path";
import { commonPageProperties, commonPageFooter } from "../reportUtils";
import { IReportMapPageProperties } from "./types";

export const reportMapPage = (properties: IReportMapPageProperties) => {
  const { heading, subheading, imgBuffer } = properties;

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
        data: imgBuffer,
        transformation: {
          width: 950,
          height: 558,
        },
        floating: {
          zIndex: 9,
          horizontalPosition: {
            relative: HorizontalPositionRelativeFrom.LEFT_MARGIN,
            offset: 0,
          },
          verticalPosition: {
            relative: VerticalPositionRelativeFrom.TOP_MARGIN,
            offset: 1514400,
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
    children: [images, imageBorderTextBox, headings, idTextBox],
  };
};
