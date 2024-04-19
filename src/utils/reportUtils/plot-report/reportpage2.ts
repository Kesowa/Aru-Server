import { IDeliverable } from "./types";
import {
  Paragraph,
  AlignmentType,
  TextRun,
  ImageRun,
  HorizontalPositionRelativeFrom,
  HorizontalPositionAlign,
  VerticalPositionAlign,
  VerticalPositionRelativeFrom,
  FrameAnchorType,
  ShadingType,
} from "docx";
import { commonPageFooter, commonPageProperties } from "./../reportUtils";

const imageTopHeading = (imageHeading: string) => {
  return new Paragraph({
    frame: {
      position: {
        x: 10000,
        y: 100,
      },
      width: 4000,
      height: 800,
      anchor: {
        horizontal: FrameAnchorType.MARGIN,
        vertical: FrameAnchorType.MARGIN,
      },
      alignment: {
        x: HorizontalPositionAlign.CENTER,
        y: VerticalPositionAlign.CENTER,
      },
    },
    shading: {
      type: ShadingType.SOLID,
      color: "69C7E9",
    },
    alignment: AlignmentType.CENTER,
    children: [
      new TextRun({
        text: imageHeading,
        color: "ffffff",
        font: {
          name: "Arial",
        },
        size: "28pt",
        bold: true,
      }),
    ],
  });
};

const imageBox = (imageBuffer: Buffer) => {
  return new Paragraph({
    children: [
      new ImageRun({
        data: imageBuffer,
        transformation: {
          width: 1080,
          height: 630,
        },
        floating: {
          horizontalPosition: {
            relative: HorizontalPositionRelativeFrom.LEFT_MARGIN,
            offset: 194400,
          },
          verticalPosition: {
            relative: VerticalPositionRelativeFrom.TOP_MARGIN,
            offset: 1270000,
          },
        },
      }),
    ],
  });
};

export const page2 = (properties: IDeliverable) => {
  const { imageHeading, imageBuffer } = properties;

  return {
    properties: commonPageProperties,
    footers: commonPageFooter,
    children: [imageTopHeading(imageHeading), imageBox(imageBuffer)],
  };
};
