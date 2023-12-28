import mongoose from "mongoose";
import { Types } from "ts-openapi";

const VectorName = <const>[
  "Zone Boundary",
  "Block Boundary",
  "Area Boundary",
  "Median",
  "Drainage Network",
  "Electric Pole",
  "Garbage Collection Point",
  "Landmark",
  "Vacant Plot",
  "Cycle Stand",
  "Solar Area",
  "Sub Station",
  "Metro station",
  "Playground",
  "Restricted Area",
  "Election Ward Boundary",
  "Landfill",
  "Playground",
  "Election Ward Boundary",
  "Flyover",
  "Carriage Way",
  "Cycle Track",
  "Canal",
  "Powersupply Network",
  "Cellphone Tower",
  "Manhole",
  "Bus Shelters",
  "Landfill",
  "Metro Route",
  "Parking Area",
  "Potholes",
  "Municipal Boundary",
  "Canal",
  "Water Body",
  "Bus shelters",
  "Green verge",
  "Restricted Area",
  "Panchayat Boundary",
  "Revenew Ward Boundary",
  "Cycle Stand",
  "Fire Station",
  "Roundabout",
  "Plot",
  "Boundary Wall",
  "Pumping Station",
  "Over Head Tank",
  "Sewerage Network",
  "Waterbody",
  "Fire Station",
  "Public Convenience",
  "Revenew Ward Boundary",
  "Building footprint",
  "Jungle",
  "Metro Station",
  "Park",
  "Sub Station",
  "Municipal Boundary",
  "Slum Boundary",
  "Waterbody",
  "Cellphone Tower",
  "Public Convenience",
  "Sector Boundary",
  "Right of Way",
  "Footpath",
  "Parcel",
  "Circle",
  "Water Transmission Line",
  "Water Treatment Plant",
  "Drainage Pumping Station",
  "Electric Transformer",
  "Street Light",
  "Traffic Square",
  "Park",
  "Bridge/Flyover",
  "Green Verge",
  "Farming Land",
  "Mobile Drone Port",
  "Jungle",
  "Building Footprint",
  "Panchayat Boundary",
  "Slum Boundary",
  "Measurement",
  "Bridge",
  "Farming land",
  "Flyover",
  "Parking Area",
  "Solar",
  "Vacant Plot",
  "Bridge",
  "Carriage Way",
  "Drainage Network",
  "Road",
  "Street",
  "Garbage Collection Area",
  "Mobile Drone Port",
  "Potholes",
];

export interface IVector {
  _id: mongoose.Types.ObjectId;
  name: typeof VectorName[number];
  type: "Point" | "MultiLineString" | "MultiPolygon";
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
export const VectorType = {
  _id: Types.String(),
  name: Types.StringEnum({
    values: [...VectorName]
  }),
  type: Types.StringEnum({
    values: ["Point", "MultiLineString", "MultiPolygon"],
  }),
  createdBy: Types.String(),
  updatedBy: Types.String(),
  createdAt: Types.DateTime(),
  updatedAt: Types.DateTime(),
};
const vectorSchema = new mongoose.Schema<IVector>(
  {
    name: {
      type: String,
      enum: VectorName,
    },
    type: {
      type: String,
      enum: ["Point", "MultiLineString", "MultiPolygon"],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
    },
  },
  {
    timestamps: true,
  }
);
export default vectorSchema;
