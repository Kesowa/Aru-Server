import {
  LevelFormat,
  AlignmentType,
  convertInchesToTwip,
  PageOrientation,
  Footer,
  PageNumber,
  Paragraph,
  TextRun,
} from "docx";
import { vectorProps } from "../../schemas/vectorprops";

// =============================== DOCX GENERATION UTILS ===============================================================================

const levelOptions = [
  {
    level: 0,
    format: LevelFormat.LOWER_ROMAN,
    text: "%1.",
    alignment: AlignmentType.LEFT,
    style: {
      paragraph: {
        indent: {
          left: convertInchesToTwip(0.3),
          hanging: convertInchesToTwip(0.18),
        },
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
        indent: {
          left: convertInchesToTwip(0.5),
          hanging: convertInchesToTwip(0.18),
        },
      },
    },
  },
  {
    level: 2,
    text: "%3.",
    alignment: AlignmentType.START,
    style: {
      paragraph: {
        indent: {
          left: convertInchesToTwip(0.7),
          hanging: convertInchesToTwip(0.18),
        },
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
};

// ====================================================================================================================================

// ================================ CLASSIFICATION OF LAYER TYPES INTO VARIOUS CATEGORIES =============================================

// areas
export const privateCommercialLayerTypes = [
  vectorProps.BUS_SHELTERS,
  vectorProps.PARKING_AREA,
  vectorProps.CYCLE_STAND,
  vectorProps.BOUNDARY_WALL,
  vectorProps.CELLPHONE_TOWER,
  vectorProps.PARCEL,
  vectorProps.FARMING_LAND,
];
export const residentialLayerTypes = [vectorProps.PLOT];
export const govtCommercialLayerTypes = [
  vectorProps.SUB_STATION,
  vectorProps.METRO_STATION,
  vectorProps.METRO_ROUTE,
  vectorProps.PUBLIC_CONVENIENCE,
  vectorProps.MOBILE_DRONE_PORT,
];
export const housingComplexLayerTypes = [];
export const govtLayerTypes = [
  vectorProps.RESTRICTED_AREA,
  vectorProps.POWER_SUPPLY_NETWORK,
  vectorProps.LANDFILL,
  vectorProps.FIRE_STATION,
  vectorProps.RIGHT_OF_WAY,
  vectorProps.WATER_TRANSMISSION_LINE,
  vectorProps.WATER_TREATMENT_PLANT,
  vectorProps.GARBAGE_COLLECTION_AREA,
];
export const motorableRoadsLayerTypes = [
  vectorProps.FLYOVER,
  vectorProps.ROUNDABOUT,
  vectorProps.BRIDGE_FLYOVER,
  vectorProps.BRIDGE,
  vectorProps.CARRIAGE_WAY,
  vectorProps.ROAD,
  vectorProps.STREET,
];
export const footpathLayerTypes = [vectorProps.FOOTPATH];
export const cycleTrackLayerTypes = [vectorProps.CYCLE_TRACK];
export const greeneryLayerTypes = [
  vectorProps.PLAYGROUND,
  vectorProps.PARK,
  vectorProps.GREEN_VERGE,
  vectorProps.JUNGLE,
];
export const waterBodyLayerTypes = [
  vectorProps.DRAINAGE_NETWORK,
  vectorProps.CANAL,
  vectorProps.SEWERAGE_NETWORK,
  vectorProps.WATER_BODY,
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

export const deliverableTypes: { [key: string]: string[] } = {
  OVERVIEW: [vectorProps.PLOT],
  BOUNDARY: [],
  "BUILT-UP AREA": [vectorProps.BUILDING_FOOTPRINT],
  "AMENITIES AND POI": [],
  "OTHER FEATURES": [],
  "ACTIONABLE POINTS": [],
  "OCCUPIED UNTAXED AREA (ENCROACHMENT)": [],
  "ROAD DETAILS": [vectorProps.ROAD],
  "FOOTPATH DETAILS": [vectorProps.FOOTPATH],
  "CYCLE TRACK DETAILS": [vectorProps.CYCLE_TRACK],
  "WATERBODIES DETAILS": [
    vectorProps.DRAINAGE_NETWORK,
    vectorProps.CANAL,
    vectorProps.SEWERAGE_NETWORK,
    vectorProps.WATER_BODY,
  ],
  "GREENERY DETAILS": [vectorProps.PLAYGROUND, vectorProps.PARK, vectorProps.GREEN_VERGE, vectorProps.JUNGLE],
  "WATER TANK": [],
  "STREET-LIGHT DETAILS": [],
};
