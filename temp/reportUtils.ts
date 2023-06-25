import { LevelFormat, AlignmentType, convertInchesToTwip, PageOrientation, Footer, PageNumber, Paragraph, TextRun } from "docx";

const levelOptions = [
    {
        level: 0,
        format: LevelFormat.LOWER_ROMAN,
        text: "%1.",
        alignment: AlignmentType.LEFT,
        style: {
            paragraph: {
                indent: { left: convertInchesToTwip(0.3), hanging: convertInchesToTwip(0.18) },
            },
        },
        start: 1,
    },
    {
        level: 1,
        format: LevelFormat.LOWER_LETTER,
        text: "%2.",
        alignment: AlignmentType.START,
        style: {
            paragraph: {
                indent: { left: convertInchesToTwip(0.5), hanging: convertInchesToTwip(0.18) },
            },
        },
    },
    {
        level: 2,
        text: "%3.",
        alignment: AlignmentType.START,
        style: {
            paragraph: {
                indent: { left: convertInchesToTwip(0.7), hanging: convertInchesToTwip(0.18) },
            },
        },
    },
];

export const numberings = {
    config: [
        { reference: "pg3-table1-column1", levels: levelOptions },
        { reference: "pg3-table1-column2", levels: levelOptions },
        { reference: "pg3-table1-column3", levels: levelOptions },
        { reference: "pg3-table1-column4", levels: levelOptions },
        { reference: "pg3-table2-column1", levels: levelOptions },
        { reference: "pg3-table2-column4", levels: levelOptions },
        { reference: "pg3-table3-others", levels: levelOptions },
        { reference: "pg3-table3-waterDrainage", levels: levelOptions },
    ],
};

export const commonPageProperties = {
    page: {
        margin: {
            top: 500,
        },
        size: {
            orientation: PageOrientation.LANDSCAPE,
        },
    },
};

export const commonPageFooter = {
    default: new Footer({
        children: [
            new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                    new TextRun({
                        size: "14pt",
                        children: ["Page: ", PageNumber.CURRENT],
                    }),
                ],
            }),
        ],
    }),
}