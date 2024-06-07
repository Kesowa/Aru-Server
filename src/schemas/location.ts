import mongoose from "mongoose";
import { Types } from "ts-openapi";
// https://www.rfc-editor.org/rfc/rfc7946#section-3.1.1
type Position = {
  lng: number;
  lat: number;
};
type Point = {
  type: "Point";
  coordinates: Position;
};
type MultiPoint = {
  type: "MultiPoint";
  coordinates: Array<Position>;
};
type LineString = {
  type: "LineString";
  coordinates: Array<Position>;
};
type MultiLineString = {
  type: "MultiLineString";
  coordinates: Array<LineString>;
};
type LinearRing = Array<Position>; // A closed LineString
type Polygon = {
  type: "Polygon";
  coordinates: Array<LinearRing>;
};
type MultiPolygon = {
  type: "MultiPolygon";
  coordinates: Array<Polygon>;
};
export type GeometryObj =
  | Point
  | MultiPoint
  | LineString
  | MultiLineString
  | Polygon
  | MultiPolygon;
export interface ILocation {
  _id: mongoose.Types.ObjectId;
  geometry: GeometryObj;
  properties: {
    name: string;
  };
  tenantId: mongoose.Types.ObjectId; // index
}
export const LocationType = {
  _id: Types.String(),
  geometry: Types.Object({
    properties: {
      type: Types.StringEnum({
        values: [
          "Point",
          "MultiPoint",
          "LineString",
          "MultiLineString",
          "Polygon",
          "MultiPolygon",
        ],
      }),
      // "coordinates" not included as it can be of many types: object, array of objects, array of array of objects, etc.
    },
  }),
  properties: Types.Object({
    properties: {
      name: Types.String(),
    },
  }),
  tenantId: Types.String(), // index
};
const locationSchema = new mongoose.Schema<ILocation>({
  geometry: {
    type: {
      type: String,
      enum: [
        "Point",
        "MultiPoint",
        "LineString",
        "MultiLineString",
        "Polygon",
        "MultiPolygon",
      ],
      required: true,
    },
    coordinates: mongoose.Schema.Types.Mixed,
  },
  properties: {
    name: String,
  },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
});
locationSchema.index({ geometry: "2dsphere" });
export default locationSchema;
