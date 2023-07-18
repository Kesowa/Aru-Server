import { LevelFormat, AlignmentType, convertInchesToTwip, PageOrientation, Footer, PageNumber, Paragraph, TextRun } from "docx";

import * as d3 from "d3";
import { JSDOM } from "jsdom";
import sharp from "sharp";

// =============================== DOCX GENERATION UTILS ===============================================================================

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

// ====================================================================================================================================

// ================================ CLASSIFICATION OF LAYER TYPES INTO VARIOUS CATEGORIES =============================================

// areas
export const privateCommercialLayerTypes = [
    "Bus Shelters", 
    "Parking Area", 
    "Cycle Stand", 
    "Boundary Wall", 
    "Cellphone Tower", 
    "Parcel", 
    "Farming Land", 
];
export const residentialLayerTypes = ["Plot", ];
export const govtCommercialLayerTypes = [
    "Sub Station", 
    "Metro station", 
    "Metro Route", 
    "Public Convenience", 
    "Mobile Drone Port", 
];
export const housingComplexLayerTypes = [];
export const govtLayerTypes = [
    "Restricted Area", 
    "Powersupply Network", 
    "Landfill", 
    "Fire Station", 
    "Right of Way", 
    "Water Transmission Line", 
    "Water Treatment Plant", 
    "Garbage Collection Area", 
];
export const motorableRoadsLayerTypes = [
    "Flyover", 
    "Roundabout", 
    "Bridge/Flyover", 
    "Bridge", 
    "Carriage Way", 
    "Road", 
    "Street", 
];
export const footpathLayerTypes = ["Footpath"];
export const cycleTrackLayerTypes = ["Cycle Track",];
export const greeneryLayerTypes = [
    "Playground", 
    "Park", 
    "Green Verge", 
    "Jungle", 
];
export const waterBodyLayerTypes = [
    "Drainage Network", 
    "Canal", 
    "Sewerage Network", 
    "Waterbody",
];

// Doubt in areas:
/*
    [ 
        "Median"(what is it?), 
        "Vacant Plot"(govt. or private ?), 
        "Solar Area"(govt. or private ?), 
        "Potholes"
    ]
*/

// Overlapping in areas: 
/* 
    [ 
        "Zone Boundary", 
        "Block Boundary", 
        "Area Boundary", 
        "Election Ward Boundary", 
        "Municipal Boundary", 
        "Panchayat Boundary",
        "Revenew Ward Boundary",
        "Municipal Boundary",
        "Sector Boundary",
        "Building Footprint",
        "Slum Boundary",

    ]
*/

// occupancy
export const underConstructionTypes = [];
export const vacantTypes = ["Vacant Plot"];

// ===================================================================================================================================

export const genStackedBarChart = async (data: any[]) => {
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

