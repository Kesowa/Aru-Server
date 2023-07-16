import { LevelFormat, AlignmentType, convertInchesToTwip, PageOrientation, Footer, PageNumber, Paragraph, TextRun } from "docx";

import * as d3 from "d3";
import { JSDOM } from "jsdom";
import sharp from "sharp";
// import puppeteer from "puppeteer";
import puppeteer from 'puppeteer-core';
import fs from "fs/promises";
import path from "path";

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

// ================================= IMAGE GENERATION UTILS ==========================================================================

export const genPieChart = async (data: any[]) => {
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

// export const genPieChart = async (data: any[], heading: string) => {
//     const html = await fs.readFile(path.join(__dirname, "mapbox", "index.html"), "utf-8");
//     const browser = await puppeteer.launch({
//         executablePath: "/usr/bin/google-chrome",
//         args: [
//         "--no-sandbox",
//         "--disable-setuid-sandbox",
//         "--disable-dev-shm-usage"
//         ],
//         headless: true,
//     });
// 	const page = await browser.newPage();
// 	const content = html;

//     await page.goto(`data: text/html, ${content}`, { 
//         waitUntil: "networkidle0" 
//     });
//     await page.setContent(content);
//     await page.emulateMediaType("screen");

//     await page.evaluate(() => {
//         window.setHeading(heading);
//         window.genPieChart(data);
//     })

//     const pngBuff = await page.screenshot({ type: "png" });
//     return pngBuff;
// };

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

export const genScreenshot = async () => {
    const html = await fs.readFile(path.join(__dirname, "mapbox", "index.html"), "utf-8");
    const browser = await puppeteer.launch({
        executablePath: "/usr/bin/google-chrome",
        args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage"
        ],
        headless: true,
    });
	const page = await browser.newPage();
	const content = html;

    await page.goto(`data: text/html, ${content}`, { 
        waitUntil: "networkidle0" 
    });
    await page.setContent(content);
    await page.emulateMediaType("screen");

    await page.evaluate(() => {
        // Turn component with given id into mapbox
        // Use the given COG server url for rendering the raster layers

        window.isMapLoaded = false;

        window.setupMap("map", "https://cog-nk.kesowa.com").then(() => {
            // Center on first geojson url
            // Render all given geojson urls
            window.renderVector([
            "https://cdn-dev.kesowa.com/vector/00854a1e-568d-42db-84e9-a310df7593c9.geojson",
            "https://cdn-dev.kesowa.com/vector/59af3119-fd68-48d0-966a-9a0008ec2b18.geojson"
            ]).then(() => {
                console.log("rendered vector")
                setTimeout(() => {
                    window.isMapLoaded = true;
                }, 7000);
            }).catch(console.error);

            // Center on first raster url
            // Render all given ortho urls
            // renderRaster([
            //   // "http://172.17.0.1:5151/raster/a0789482-62c7-4ab5-b9a4-9f83694d0a9e.tif",
            //   "http://172.17.0.1:5151/raster/f6b443a1-7724-4bd6-9be9-4f33fd0fc98c.tif"
            // ])
        })
        .catch((error: any) => console.error("Error loading map", error));
    });

    await page.waitForFunction("window.isMapLoaded === true");

    const pngBuff = await page.screenshot({ type: "png" });
    
    await browser.close();

    return pngBuff;
}
