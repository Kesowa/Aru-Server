import mongoose from "mongoose";
import { Types } from "ts-openapi";

export interface IFlight {
  _id: mongoose.Types.ObjectId;
  name: string;
  description: string;
  pilotID: mongoose.Types.ObjectId; // index
  mission: mongoose.Types.ObjectId; // index
  date: string; // index
  time: string;
  duration: string;
  locationID: mongoose.Types.ObjectId; // index
  geoFence: mongoose.Schema.Types.Mixed;
  centerPoints?: {
    lng: number;
    lat: number;
  };
  tenant: mongoose.Types.ObjectId; // index
  geoLocation?: string;
  assetID?: mongoose.Types.ObjectId;
  client: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
export const FlightType = {
  _id: Types.String(),
  name: Types.String(),
  description: Types.String(),
  pilotID: Types.String(), // index
  mission: Types.String(), // index
  date: Types.String(), // index
  time: Types.String(),
  duration: Types.String(),
  locationID: Types.String(), // index
  geoFence: Types.Object({ properties: {} }),
  centerPoints: {
    lng: Types.Number(),
    lat: Types.Number(),
  },
  tenant: Types.String(), // index
  geoLocation: Types.String(),
  assetID: Types.String(),
  client: Types.String(),
  createdAt: Types.DateTime(),
  updatedAt: Types.DateTime(),
};
const flightSchema = new mongoose.Schema<IFlight>(
  {
    date: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    geoLocation: {
      type: String,
    },
    mission: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "mission",
      required: true,
    },
    centerPoints: {
      type: {
        lng: Number,
        lat: Number,
      },
    },
    locationID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "location",
    },
    assetID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "asset",
      required: false,
    },
    time: {
      type: String,
      required: true,
    },
    duration: {
      type: String,
      required: true,
    },
    //Every flight will have a pilot assigned to it
    pilotID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },

    geoFence: {
      polygon: {
        points: {
          type: [
            {
              lng: Number,
              lat: Number,
            },
          ],
          default: undefined,
        },
        area: {
          type: Number,
        },
        length: {
          type: Number,
        },
      },
      circle: {
        radius: {
          type: Number,
        },
        area: {
          type: Number,
        },
        center: {
          lng: {
            type: Number,
          },
          lat: {
            type: Number,
          },
        },
      },
    },
    //the client/creator of the project
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    //tenant/the one delivering the drone
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tenant",
      required: true,
    },
    createdAt: {
      type: Date,
    },
    updatedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);
flightSchema.index({
  locationID: 1,
  mission: 1,
  pilotID: 1,
  tenant: 1,
  date: 1,
});
export default flightSchema;
