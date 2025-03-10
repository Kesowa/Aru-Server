db = new Mongo().getDB("test");

db.createCollection("tenants", { capped: false });
db.createCollection("users", { capped: false });
db.createCollection("packages", { capped: false });
db.createCollection("missiontypes", { capped: false });
db.createCollection("missions", { capped: false });
db.createCollection("layers", { capped: false });
db.createCollection("permissions", { capped: false });
db.createCollection("usergroups", { capped: false });
db.createCollection("assets", { capped: false });
db.createCollection("streamkeys", { capped: false });
db.createCollection("flights", { capped: false });
db.createCollection("locations", { capped: false });

const TENANT = ObjectId("5f204f03b9445726102781a8");
const SUPER_ADMIN = ObjectId("5f12572c3c19462d3673dbe9");
const TENANT_ROOT = ObjectId("608e7b3ae11f711a34fb0476");
const FIRST_USER = ObjectId("614ec3dcd44bea14a721326a");

const commonProps = {
  all: {
    createdBy: FIRST_USER,
    updatedBy: FIRST_USER,
    createdAt: ISODate(),
    updatedAt: ISODate(),
    __v: 0,
  },
  users: {
    customPermissions: [],
    isActive: true,
    isBanned: false,
    password: "$2a$10$tUth515EOFQs0Gzz6iFI9uPYjorlrxz2Inl10wJZGIxnM9H5qgISy", // fsipl1@3$
    tenantId: TENANT,
    avatar: "/images/userAvatars/avatar-1632551865904.png",
    isTermsAccepted: true,
    loginOtps: [583630],
    loginRequested: true,
    passwordResetToken: "",
  },
  layers: {
    layers: [],
    layerGroupId: null,
    captureDate: ISODate(),
    tenantId: TENANT,
    layerLabel: "Id",
    isBase: false,
    isPublic: false,
    publicMapRef: null,
    layerdataArr: [],
    center: [],
    flaggedFeatures: [],
    isFlagged: false,
    isThreadExist: false,
    commentCount: 0,
  },
  missions: {
    description: "Sample Description",
    deliverables: ["Orthomosaic", "DEM", "DTM"],
    status: "Completed",
    user: TENANT_ROOT,
    assetID: ObjectId("609249c6c287ba31a4d23ef9"),
    tenantId: TENANT,
    missionType: ObjectId("60cc7d408fb1793e8c76d4a3"),
    clientId: [],
    invites: [],
    size: 0,
    isPublic: false,
  },
  usergroups: {
    isActive: true,
    tenantId: TENANT,
  },
  flights: {
    date: "2023-12-17",
    geoLocation:
      "HFFC+G3V, Major Arterial Road (South East Extension), DC Block(Newtown), Action Area I, Newtown, New Town, Koch Pukur, West Bengal 700156, India",
    centerPoints: {
      lng: 88.47035320408446,
      lat: 22.573772651224107,
    },
    locationID: ObjectId("5f202f03b9225726102721b8"),
    assetID: ObjectId("609249c6c287ba31a4d23ef9"),
    time: "04:25:02 PM",
    duration: "2hr",
    geoFence: {
      polygon: null,
      circle: {
        radius: 854.8149453079126,
        area: 9180622.733828312,
        center: {
          lng: 88.47035320408446,
          lat: 22.573772651224107,
        },
      },
    },
    client: TENANT_ROOT,
    tenant: TENANT,
    pilotID: FIRST_USER,
  },
};

db.locations.insertOne({
  _id: ObjectId("5f202f03b9225726102721b8"),
  geometry: {
    type: "Point",
    coordinates: [88.88, 22.22],
  },
  properties: {
    name: "Base",
  },
  tenantId: TENANT,
  ...commonProps.all,
});

db.streamkeys.insertOne({
  _id: ObjectId("5f204f03b9415726102741a4"),
  isActive: true,
  pStatus: true,
  streamKey:
    "NjFmYmNjZWNiMGY1ZjcwYmVkYTRjZDExLTYyNjdkZDRiMmEyZDM5NDA4MGEyMDg0OS11bmRlZmluZWQtNjA4ZTdiMzllMTFmNzExYTM0ZmIwNDc1",
  tenantID: TENANT,
  assetID: ObjectId("609249c6c287ba31a4d23ef9"),
  missionID: ObjectId("61fbccecb0f5f70beda4cd11"),
  flightID: ObjectId("5f202f03b9225726102721a2"),
  locationID: ObjectId("5f202f03b9225726102721b8"),
  ...commonProps.all,
});

db.assets.insertOne({
  _id: ObjectId("609249c6c287ba31a4d23ef9"),
  assetInfo: [
    {
      UIN: "1x99P-m",
      FCID: "kmd8745",
      serialNO: "123xxvgl67",
    },
  ],
  assetName: "NKDA Phantom",
  userID: TENANT_ROOT,
  tenantID: TENANT,
  isActive: true,
  modelID: ObjectId("6091a6cb9c78264570101eb6"),
  assetOwner: TENANT_ROOT,
  manufactureDate: ISODate("2022-01-15T00:00:00Z"),
  manufactureID: ObjectId("6091a0559c78264570101eb1"),
  ...commonProps.all,
});

db.models.insertOne({
  _id: ObjectId("6091a6cb9c78264570101eb6"),
  modelName: "MAVLINK Drone",
  modelNumber: "ASASD112123123",
  assetClassID: ObjectId("60ae07d5b4ed84014ad4ab28"),
  dimensions: {
    length: 123,
    breadth: 23,
    height: 34,
  },
  manufacturerID: ObjectId("615acf24e5324204d8b97c84"),
  website: "https://www.dji.com/phantom-4-pro/info#specs",
  tenantID: TENANT,
  props: {
    Payloads: "Megaphone, RGB sensor, Tharmal",
  },
  ...commonProps.all,
});

db.assetclasses.insertOne({
  _id: ObjectId("60ae07d5b4ed84014ad4ab28"),
  typeName: "drone",
  ...commonProps.all,
});

db.manufacturers.insertOne({
  _id: ObjectId("615acf24e5324204d8b97c84"),
  name: "Throttle Aerospace Systems",
  address: "bangalore, karnataka",
  nationality: "India",
  website: "https://www.throttleaerospace.com/",
  contacts: [
    {
      _id: ObjectId("615acf24e5324204d8b97c85"),
      name: "Shashi",
      designation: "Drone Engineer",
      Mobile: "9986342735",
      email: "shashi@throttleaerospace.com",
    },
  ],
  tenantID: TENANT,
  ...commonProps.all,
});

db.tenants.insertOne({
  _id: TENANT,
  upcomingPackages: [],
  isActive: false,
  isActivated: true,
  name: "NKDA",
  phoneNo: "9563152391",
  email: "admin@NKDA.com",
  contactPerson: "John Doe",
  registrationNumber: "123",
  gstNumber: "343434",
  billingAddressLine1: "bazar-para",
  billingAddressLine2: "bishnupur",
  billingCity: "BASWA",
  billingDistrict: "Birbhum",
  billingState: "near durga mandir",
  billingPin: "731209",
  avatar: "/images/userAvatars/NKDA_Logo.png",
  officialWebsite: "nkda.org",
  modefiedEmailRequestedOTPs: [],
  modefiedphoneNoRequestedOTPs: [],
  activePackage: ObjectId("608e7a7ee11f711a34fb0474"),
  bandwidthUsed: 0,
  packageStartDate: ISODate(),
  storageUsed: 0,
  actualAlertCount: 0,
  actualClientCount: 10,
  actualLayerCount: 0,
  actualLocationCount: 0,
  actualMissionCount: 0,
  actualUserCount: 1,
  actualUserGroupCount: 0,
  actualVodCount: 0,
  actualSize: NumberDecimal("0.0"),
  publicMapRef: "5f204f03b9445726102781a862148702831c465d972286b3",
  ...commonProps.all,
  createdBy: SUPER_ADMIN,
  updatedBy: TENANT_ROOT,
});

db.users.insertMany([
  {
    _id: TENANT_ROOT,
    name: "NKDA",
    email: "admin@NKDA.com",
    phoneNo: "9903032571",
    userType: "tenant-root",
    ...commonProps.users,
    ...commonProps.all,
    createdBy: SUPER_ADMIN,
    updatedBy: SUPER_ADMIN,
  },
  {
    _id: SUPER_ADMIN,
    name: "KESOWA",
    email: "admin@kesowa.com",
    phoneNo: "9903032572",
    userType: "super-admin",
    ...commonProps.users,
    ...commonProps.all,
    tenantId: null,
    createdBy: SUPER_ADMIN,
    updatedBy: SUPER_ADMIN,
  },
  {
    _id: FIRST_USER,
    name: "Neel Dutta pilot",
    email: "pilot1@kesowa.com",
    phoneNo: "1234567823",
    userType: "tenant-staff",
    userGroupId: ObjectId("6034c331a2f9c7554b1d42e0"),
    ...commonProps.users,
    ...commonProps.all,
    createdBy: TENANT_ROOT,
    updatedBy: FIRST_USER,
  },
  {
    name: "TestStaff1",
    email: "staff1@kesowa.com",
    phoneNo: "9903032573",
    userType: "tenant-staff",
    userGroupId: ObjectId("66a1e5ddf317d282f50f9f47"),
    ...commonProps.users,
    ...commonProps.all,
    createdBy: TENANT_ROOT,
    updatedBy: TENANT_ROOT,
  },
]);

db.users.insertMany(
  "0123456789".split("").map((i) => ({
    name: `TestClient${i}`,
    email: `client${i}@kesowa.com`,
    phoneNo: "9" + Math.random().toString().substring(2, 11),
    userType: "tenant-client",
    userGroupId: ObjectId("6116058af270c9142c1588f2"),
    ...commonProps.users,
    ...commonProps.all,
  }))
);

db.packages.insertMany([
  {
    _id: ObjectId("608e7a7ee11f711a34fb0474"),
    isActive: true,
    name: "Gold NKDA",
    bandwidth: 1000,
    storage: 1000000,
    duration: 800,
    userCount: 1000,
    missionCount: 1000000,
    layerCount: 1000000,
    alertCount: 1000000,
    vodCount: 1000000,
    clientCount: 1000000,
    locationCount: 1000000,
    userGroupCount: 1000000,
    price: 1, // added price property for testing payments
    poster: "/images/packagePosters/poster-1619950204943.png",
    ...commonProps.all,
    createdBy: SUPER_ADMIN,
    updatedBy: SUPER_ADMIN,
  },
  {
    _id: ObjectId("608e7a7ee11f722a34fb0585"),
    isActive: true,
    name: "Trial",
    bandwidth: 0,
    storage: 0,
    duration: 0,
    userCount: 1,
    missionCount: 0,
    layerCount: 0,
    alertCount: 0,
    vodCount: 0,
    clientCount: 0,
    locationCount: 0,
    userGroupCount: 0,
    price: 0, // added price property for testing payments
    poster: "/images/default.png",
    ...commonProps.all,
  },
]);

const missionTypes = [
  {
    _id: ObjectId("60cc7d408fb1793e8c76d4a3"),
    name: "Mapping",
    description: "Request a drone mapping mission",
  },
  {
    _id: ObjectId("5f4771e3976282570dbfffc8"),
    name: "Surveillance",
    description: "Request a live video surveillance from a device",
  },
];

db.missiontypes.insertMany(
  missionTypes.map((missionType) => ({
    ...commonProps.all,
    ...missionType,
    isActive: true,
    createdBy: SUPER_ADMIN,
    updatedBy: SUPER_ADMIN,
  }))
);

const missions = [
  { _id: ObjectId("61f3b1e65f915a05cb8885ec"), name: "Mapping mission sample" },
  {
    _id: ObjectId("61fbccecb0f5f70beda4cd11"),
    name: "Survillance mission sample",
    status: "Live",
    missionType: ObjectId("5f4771e3976282570dbfffc8"),
  },
  { _id: ObjectId("657ed3d3b7e5f1af532b9f6e"), name: "PlotReportDemo" },
];

db.missions.insertMany(
  missions.map((mission) => ({
    ...commonProps.all,
    ...commonProps.missions,
    ...mission,
  }))
);

const flights = [
  {
    _id: ObjectId("5f202f03b9225726102721a2"),
    name: "Live streaming flight test",
    mission: ObjectId("61fbccecb0f5f70beda4cd11"),
  },
  {
    _id: ObjectId("6267dd4b2a2d394080a20849"),
    name: "Surveillance mission sample flight",
    mission: ObjectId("61fbccecb0f5f70beda4cd11"),
  },
  {
    _id: ObjectId("6267dd4b2a2d394080a20869"),
    name: "Mapping mission sample flight",
    mission: ObjectId("61f3b1e65f915a05cb8885ec"),
  },
  {
    _id: ObjectId("657ed3d3b7e5f1af532b9f72"),
    name: "PlotDemoFlight",
    mission: ObjectId("657ed3d3b7e5f1af532b9f6e"),
  },
];

db.flights.insertMany(
  flights.map((flight) => ({
    ...commonProps.all,
    ...commonProps.flights,
    ...flight,
  }))
);

const layers = [
  // "Mapping mission sample" Mission Layers
  {
    _id: ObjectId("61e7b5ab7f65140b304f4842"),
    name: "Solar uploaded from images",
    type: "Vector",
    vector: "Landmark",
    missionId: ObjectId("61f3b1e65f915a05cb8885ec"),
    color: "#02e6b3",
    fileSize: 0.00116,
    layerpath: "/vector/solar.geojson",
    featureCount: 104,
  },
  {
    _id: ObjectId("64baa0813dc27c684126b8f1"),
    name: "OVERVIEW",
    type: "Vector",
    vector: "Plot",
    missionId: ObjectId("61f3b1e65f915a05cb8885ec"),
    color: "#f5a623",
    fileSize: 0.00116,
    layerpath: "/vector/Plot.geojson",
    featureCount: 5211,
  },
  {
    _id: ObjectId("64baa216fef8faa73c030ab1"),
    name: "BUILT-UP AREA",
    type: "Vector",
    vector: "Building Footprint",
    missionId: ObjectId("61f3b1e65f915a05cb8885ec"),
    color: "#85580f",
    fileSize: 0.00116,
    layerpath: "/vector/Building_Footprints.geojson",
    featureCount: 2322,
  },
  {
    _id: ObjectId("64baa29d90d8e029361cd9a7"),
    name: "GREENERY",
    type: "Vector",
    vector: "Green Verge",
    missionId: ObjectId("61f3b1e65f915a05cb8885ec"),
    color: "#81ee0a",
    fileSize: 0.00116,
    layerpath: "/vector/Tree_Cover.geojson",
    featureCount: 26,
  },
  {
    _id: ObjectId("64baa33a65a169c6fa285606"),
    name: "WATERBODY",
    type: "Vector",
    vector: "Waterbody",
    missionId: ObjectId("61f3b1e65f915a05cb8885ec"),
    color: "#4a90e2",
    fileSize: 0.00116,
    layerpath: "/vector/WaterBody.geojson",
    featureCount: 47,
  },
  {
    _id: ObjectId("64baa7dd5bdce318185b8c20"),
    name: "CYCLE TRACK",
    type: "Vector",
    vector: "Cycle Track",
    missionId: ObjectId("61f3b1e65f915a05cb8885ec"),
    color: "#9013fe",
    fileSize: 0.00116,
    layerpath: "/vector/Street_Multipolygon.geojson",
    featureCount: 272,
  },
  {
    _id: ObjectId("61eb92375f7a012bcdbbfb2a"),
    name: "Raster ortho image",
    type: "Raster",
    raster: "ORTHO",
    missionId: ObjectId("61f3b1e65f915a05cb8885ec"),
    color: "#f5a623",
    fileSize: 0.00116,
    layerpath: "/raster/Ortho_25cm.tif",
    featureCount: 5,
  },
  // "PlotReportDemo" Mission Layers
  {
    _id: ObjectId("657ec970b7e5f1af532b9ec7"),
    name: "PLOT",
    type: "Vector",
    vector: "Plot",
    missionId: ObjectId("657ed3d3b7e5f1af532b9f6e"),
    color: "#f8e71c",
    fileSize: 0.00056,
    layerpath: "/vector/AA1_Plot.geojson",
    featureCount: 5211,
    flaggedFeatures: [4977],
  },
  {
    _id: ObjectId("657eca85b7e5f1af532b9ee6"),
    name: "BUILDING",
    type: "Vector",
    vector: "Building Footprint",
    missionId: ObjectId("657ed3d3b7e5f1af532b9f6e"),
    color: "multicolor",
    fileSize: 0.00052,
    layerpath: "/vector/AA1_Building_Footprint.geojson",
    featureCount: 3892,
  },
  {
    _id: ObjectId("657ed057b7e5f1af532b9ef9"),
    name: "BLOCK",
    type: "Vector",
    vector: "Block Boundary",
    missionId: ObjectId("657ed3d3b7e5f1af532b9f6e"),
    color: "#9013fe",
    fileSize: 0.00052,
    layerpath: "/vector/AA1_Block_Boundary.geojson",
    featureCount: 36,
    flaggedFeatures: [23],
  },
  {
    _id: ObjectId("657ed742ec705f444b069712"),
    name: "BLOCK RASTER",
    type: "Raster",
    raster: "ORTHO",
    missionId: ObjectId("657ed3d3b7e5f1af532b9f6e"),
    color: "#f5a623",
    fileSize: 0.00116,
    layerpath: "/raster/Ortho_25cm.tif",
    featureCount: 5,
  },
  {
    _id: ObjectId("657ed9781db9a1121fafe78c"),
    name: "GREENERY",
    type: "Vector",
    vector: "Green Verge",
    missionId: ObjectId("657ed3d3b7e5f1af532b9f6e"),
    color: "#7ed321",
    fileSize: 0.00054,
    layerpath: "/vector/AA1_Green_Cover.geojson",
    featureCount: 244,
  },
  {
    _id: ObjectId("657ed9dd1db9a1121fafe7b1"),
    name: "CANOPY",
    type: "Vector",
    vector: "Jungle",
    missionId: ObjectId("657ed3d3b7e5f1af532b9f6e"),
    color: "#417505",
    fileSize: 0.00087,
    layerpath: "/vector/AA1_Tree_Count.geojson",
    featureCount: 7498,
  },
  {
    _id: ObjectId("657eda6a1db9a1121fafe7ee"),
    name: "WATERBODY",
    type: "Vector",
    vector: "Waterbody",
    missionId: ObjectId("657ed3d3b7e5f1af532b9f6e"),
    color: "#4a90e2",
    fileSize: 0.00051,
    layerpath: "/vector/AA1_Canals.geojson",
    featureCount: 33,
  },
  {
    _id: ObjectId(),
    name: "GARBAGE COLLECTION",
    type: "Vector",
    vector: "Garbage Collection Point",
    missionId: ObjectId("657ed3d3b7e5f1af532b9f6e"),
    color: "#d0021b",
    fileSize: 0.00051,
    layerpath: "/vector/AA1_GarbageCollection.geojson",
    featureCount: 8,
  },
  // Public Layers
  {
    _id: ObjectId("6693ac2b07bccc06869febb6"),
    name: "PUBLIC_PLOT",
    type: "Vector",
    vector: ObjectId("60c3a13fca0cbe039fce0d4f"),
    layerpath: "/vector/Public_Plot.geojson",
    layerdataArr: [],
    color: "#f8e71c",
    layers: [],
    isPublic: true,
    isBase: false,
    center: [],
    fileSize: 4.8562469482421875,
    captureDate: ISODate("2022-01-15T00:00:00Z"),
    tenantId: ObjectId("5f204f03b9445726102781a8"),
    createdBy: ObjectId("608e7b3ae11f711a34fb0476"),
    updatedBy: ObjectId("608e7b3ae11f711a34fb0476"),
    flaggedFeatures: [],
    isFlagged: false,
    isThreadExist: false,
    commentCount: 0,
    createdAt: ISODate("2022-01-15T00:00:00Z"),
    updatedAt: ISODate("2022-01-15T00:00:00Z"),
    featureCount: 5211,
    metadata: {
      searchIndexPath: "/vector/index_Public_Plot.json",
    },
    __v: 0,
  },
];

db.layers.insertMany(
  layers.map((layer) => ({
    ...commonProps.all,
    ...commonProps.layers,
    ...layer,
  }))
);

db.layerfiles.insertMany([
  {
    _id: ObjectId("659258833d1238b3adb10f27"),
    name: "PlotReportDemo_FrontView.png",
    layerId: ObjectId("657ec970b7e5f1af532b9ec7"),
    layers: [],
    sys_Id: "65a963a850f52c6c594ea7e5", // sys_id of the plot.features[4977]
    featureLabel: "AA/8",
    fileSize: 1.11439,
    centerPoints: {
      lng: 88.47365253647386,
      lat: 22.572921902329387,
    },
    filePath: "/images/geojson/PlotReportDemo_FrontView.png",
    fileType: "image/png",
    tenantId: TENANT,
    createdBy: TENANT_ROOT,
    updatedBy: TENANT_ROOT,
    isReview: true,
    isThreadExist: false,
    commentCount: 0,
    createdAt: ISODate("2022-01-15T00:00:00Z"),
    updatedAt: ISODate("2022-01-15T00:00:00Z"),
    __v: 0,
  },
]);

const usergroups = [
  {
    _id: ObjectId("6034c331a2f9c7554b1d42e0"),
    permissions: [
      "mission_create", // usergroup specific
      "mission_type_list",
      "location_list", // related necessary permissions
      "user_list",
      "mission_list", // common for all tenant-staff
      "client_list",
      "layer_list",
    ],
    name: "pilot",
  },
  {
    _id: ObjectId("66a1e5ddf317d282f50f9f47"),
    permissions: [
      "create_client",
      "client_list",
      "edit_client",
      "delete_client", // usergroup specific
      "user_group_list",
      "client_data",
      "user_list",
      "mission_list", // common for all tenant-staff
    ],
    isActive: true,
    name: "Client Management",
  },
  {
    _id: ObjectId("6116058af270c9142c1588f2"),
    permissions: ["client_list", "mission_list"], // common for all tenant-client
    isActive: true,
    name: "Client Access",
  },
];

db.usergroups.insertMany(
  usergroups.map((usergroup) => ({
    ...commonProps.all,
    ...commonProps.usergroups,
    ...usergroup,
    createdBy: TENANT_ROOT,
    updatedBy: TENANT_ROOT,
  }))
);
