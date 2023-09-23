const sampleData = {
  // page 1
  missionHeading: "ACTION AREA - I",
  missionSubHeading: "BLOCK AC",
  missionMapImgPath: "./images/geojsonCover1.jpg",
  missionCode: "FSIPL/NKDA/R/003",
  date: "12/01/2023",
  users: ["Akash Adhikary", "Subhendu Kumar Panja"],
  emails: ["akash.adhikary@shanta.in", "subhendu.panja@shanta.in"],
  phoneNos: ["+91 9163827816"],
  // page 2
  area: {
    // all values in sq. mtr.
    total: 142129.41,
    privateSpaces: [
      { name: "Private Commercial", value: 0.0 },
      { name: "Residential", value: 76473.75 },
      { name: "Govt. Commercial", value: 0.0 },
      { name: "Housing Complex", value: 0.0 },
    ],
    publicSpaces: [
      { name: "Government", value: 14259.07 },
      { name: "Motorable Roads", value: 19495.55 },
      { name: "Footpath", value: 4873.41 },
      { name: "Cycle Track", value: 584.46 },
      { name: "Parks & Green", value: 14430.05 },
      { name: "Waterbody", value: 701.82 },
    ],
    other: 11311.3,
  },
  occupancy: [
    {
      name: "Private Commercial",
      occupied: 0,
      underConstruction: 0,
      vacant: 0,
    },
    { name: "Residential", occupied: 157, underConstruction: 22, vacant: 50 },
    { name: "Govt. Commercial", occupied: 0, underConstruction: 0, vacant: 0 },
    { name: "Housing Complex", occupied: 0, underConstruction: 0, vacant: 0 },
    { name: "Government", occupied: 3, underConstruction: 1, vacant: 7 },
  ],
  // page 3
  roadData: [
    { name: "No of roads", value: "23" },
    { name: "Road's Length", value: "3913.31 mt.(Approx)" },
    {
      name: "Roads are sharing with adjacent blocks",
      value: [
        { name: "Adjacent Block", value: "AF,AD,AG,AA" },
        { name: "Street no. of roads", value: "32,39,41,51,64" },
        { name: "Road Segment Length", value: "1633.50 mt.(Approx)" },
        {
          name: "Street no. sharing with adjacent block",
          value: [
            { name: "", value: "51 with AA Block" },
            { name: "", value: "64 with AD & AG Block" },
            { name: "", value: "39, 41 & 42 with AF Block" },
          ],
        },
      ],
    },
    { name: "Major Road Problem", value: "NA" },
  ],
  footpathData: [
    { name: "Street with footpath", value: "32, 47, 51, 64, 41" },
    { name: "Street with partial footpath", value: "39" },
    {
      name: "Street without footpath",
      value:
        "34, 36, 38, 40, 42, 43, 44, 46, 48, 49, 50, 52, 54, 56, 58, 60, 62",
    },
  ],
  greeneryData: [
    { name: "Area", value: "14430.05 sq. mt." },
    { name: "No. of trees", value: "197" },
    {
      name: "Green Verges and Public Parks",
      value: [
        { name: "", value: "AC Block Park" },
        { name: "", value: "NKDA Park" },
        { name: "", value: "NKDA Sensory Park" },
      ],
    },
  ],
  canalData: [{ name: '"C" Canal', value: "338.86 mt." }],
  waterBodyData: [
    { name: "Perimeter", value: "99.79 mt." },
    { name: "Area", value: "701.82 sq. mt." },
    { name: "Clean", value: "Not Verified" },
    { name: "Swimmable", value: "Not Verified" },
  ],
  wasteBinData: "NA",
  constructionSitesData: "23 Nos",
  cycleTrackData: [
    { name: "Cycle Track Length", value: "1800.17 mt. (Approx)" },
    { name: "Street no. with cycle track", value: "64, 41" },
    { name: "Major Problem", value: "NA" },
    { name: "Cycle route", value: "No" },
  ],
  streetLightData: "100",
  parkingData: "00",
  publicMarketData: "00",
  stubbleBurningData: "NA",
  policeAndFireStationsData: "00",
  waterAndDrainageNetworkData: [
    { name: "No. of water tanks", value: "01" },
    { name: "Water tanks list", value: [{ name: "", value: "Water Tank 01" }] },
    { name: "Water logging", value: "NA" },
    { name: "Water Harvesting Pit", value: "NA" },
  ],
  publicArtData: "NA",
  publicGymData: "NA",
  rooftopSolarData: "NA",
  othersData: [{ name: "Neighbourhood Center", value: "001" }],
  // map pages
  deliverables: [
    { deliverable: "OVERVIEW", imgPath: "./images/page4Image.jpg" },
    { deliverable: "BOUNDARY", imgPath: "./images/page5Image.jpg" },
    { deliverable: "BUILT-UP AREA", imgPath: "./images/page8Image.png" },
    { deliverable: "AMENITIES AND POI", imgPath: "./images/page9Image.jpg" },
    { deliverable: "OTHER FEATURES", imgPath: "./images/page10Image.jpg" },
    { deliverable: "ACTIONABLE POINTS", imgPath: "./images/page11Image.jpg" },
    {
      deliverable: "OCCUPIED UNTAXED AREA (ENCROACHMENT)",
      imgPath: "./images/page12Image.jpg",
    },
    { deliverable: "ROAD DETAILS", imgPath: "./images/page13Image.jpg" },
    { deliverable: "FOOTPATH DETAILS", imgPath: "./images/page14Image.jpg" },
    { deliverable: "CYCLE TRACK DETAILS", imgPath: "./images/page15Image.jpg" },
    { deliverable: "WATERBODIES DETAILS", imgPath: "./images/page16Image.png" },
    { deliverable: "GREENERY DETAILS", imgPath: "./images/page16Image.png" },
    { deliverable: "WATERBODIES DETAILS", imgPath: "./images/page17Image.png" },
    { deliverable: "WATER TANK", imgPath: "./images/page18Image.png" },
    {
      deliverable: "STREET-LIGHT DETAILS",
      imgPath: "./images/page19Image.jpg",
    },
  ],
};
