import { Request, Router } from "express";
import mongoose from "mongoose";
import { Types } from "ts-openapi";

import openApi from "./openApi";
import Alert from "../../models/alert";
import Layer from "../../models/layer";
import Tenant from "../../models/tenant";
import VOD from "../../models/vod";
import { LayerType } from "../../schemas/layer";
import { AuthResponse } from "../../utils/interfaceUtils";

const baseLayerApi = Router();

const getAlertLocationGeojson = async (
  tenantId: mongoose.Types.ObjectId,
  startDate: Date,
  endDate: Date,
) => {
  const alerts = await Alert.find({
    tenantId,
    createdAt: { $gte: startDate, $lte: endDate },
    "location.lat": { $exists: true },
    "location.long": { $exists: true },
  });
  const geojson = {
    type: "FeatureCollection",
    name: "Images",
    crs: {
      type: "name",
      properties: {
        name: "urn:ogc:def:crs:OGC:1.3:CRS84",
      },
    },
    features: alerts.map((alert, index) => ({
      type: "Feature",
      properties: {
        _id: alert._id,
        Latitude: alert.location.lat,
        Longitude: alert.location.long,
        Name: alert.locationName,
        DoC: alert.createdAt.toLocaleDateString(),
        Remarks: alert.note,
        color: "#d0021b",
        icon: "MarkerIcon",
        LocationID: alert.locationId,
        Image: alert.image,
        isFlagged: alert.isFlagged,
      },
      geometry: {
        type: "Point",
        coordinates: [alert.location.long, alert.location.lat],
      },
    })),
  };
  return geojson;
};

const getVideoLocationGeojson = async (
  tenantId: mongoose.Types.ObjectId,
  startDate: Date,
  endDate: Date,
) => {
  const videos = await VOD.aggregate([
    {
      $match: {
        tenantId,
        createdAt: { $gte: startDate, $lte: endDate },
        locationID: { $exists: true, $ne: "undefined" },
      },
    },
    {
      $group: {
        _id: "$locationID",
        videos: {
          $push: {
            _id: "$_id",
            flightID: "$flightID",
            missionID: "$missionID",
            videoPath: "$videoPath",
            thumbnail: "$thumbnail",
            tenantId: "$tenantId",
            videoName: "$videoName",
            fileSize: "$fileSize",
            isSRT: "$isSRT",
            isFlagged: "$isFlagged",
            createdAt: "$createdAt",
            updatedAt: "$updatedAt",
          },
        },
      },
    },
    {
      $lookup: {
        from: "locations",
        localField: "_id",
        foreignField: "_id",
        as: "location",
      },
    },
    {
      $unwind: "$location",
    },
    {
      $project: {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [
            "$location.geometry.coordinates.lng",
            "$location.geometry.coordinates.lat",
          ],
        },
        properties: {
          videos: "$videos",
          name: "$location.properties.name",
          longitude: "$location.geometry.coordinates.lng",
          latitude: "$location.geometry.coordinates.lat",
          locationID: "$_id",
        },
      },
    },
  ]);
  const geojson = {
    type: "FeatureCollection",
    name: "Videos",
    crs: {
      type: "name",
      properties: {
        name: "urn:ogc:def:crs:OGC:1.3:CRS84",
      },
    },
    features: videos,
  };
  return geojson;
};

baseLayerApi.get(
  "/",
  async (
    req: Request & {
      query: {
        type?: string;
        isPublic?: boolean;
        mapRef?: string;
        startDate?: Date;
        endDate?: Date;
        limit: number;
        offset: number;
        populate: string[];
      };
    },
    res: AuthResponse,
  ) => {
    const {
      type,
      isPublic,
      mapRef,
      startDate,
      endDate,
      limit,
      offset,
      populate,
    } = req.query;
    let tenantId: mongoose.Types.ObjectId;
    if (mapRef) {
      const tenant = await Tenant.findOne(
        {
          publicMapRef: req.query.mapRef,
        },
        {
          _id: 1,
        },
      );
      tenantId = tenant._id;
    }
    const data = await Layer.find({
      tenantId: mapRef ? tenantId : res.locals.user.tenantId._id,
      $or: [{ missionId: { $exists: false } }, { missionId: null }], // for base layer
      [type && "type"]: type,
      [isPublic && "isPublic"]: isPublic,
    })
      .skip(offset)
      .limit(limit)
      .populate(populate)
      .lean();

    const resp = {
      data,
      pagination: {
        limit,
        offset,
        count: data.length,
      },
      alertGeojson: null,
      vodGeojson: null,
    };
    // only provide geojson data when requested
    if (startDate && endDate) {
      const alertData = await getAlertLocationGeojson(
        res.locals.user.tenantId._id,
        startDate,
        endDate,
      );
      resp.alertGeojson = alertData;
      const vodData = await getVideoLocationGeojson(
        res.locals.user.tenantId._id,
        startDate,
        endDate,
      );
      resp.vodGeojson = vodData;
    }

    res.json(resp);
  },
);

openApi.addPath(
  "/baselayer",
  {
    get: {
      summary: "Get base layer data",
      description: "This operation retrieves base layer information",
      operationId: "GetBaseLayer",
      requestSchema: {
        query: {
          type: Types.String(),
          isPublic: Types.Boolean(),
          mapRef: Types.String(),
          startDate: Types.DateTime(),
          endDate: Types.DateTime(),
          offset: Types.Integer({ minValue: 0, default: 0, required: true }),
          limit: Types.Integer({
            minValue: 0,
            maxValue: 100,
            default: 10,
            required: true,
          }),
          populate: Types.Array({ arrayType: Types.String() }),
        },
      },
      tags: ["Base Layer API"],
      responses: {
        200: openApi.declareSchema(
          "successful response",
          Types.Object({
            description: "Successful Operation",
            properties: {
              data: Types.Array({ arrayType: LayerType }),
              pagination: Types.Object({
                description: "pagination information for data",
                properties: {
                  offset: Types.Integer({ minValue: 0 }),
                  limit: Types.Integer({
                    minValue: 0,
                    maxValue: 100,
                    default: 10,
                  }),
                  count: Types.Integer({
                    minValue: 0,
                    maxValue: 100,
                    default: 10,
                  }),
                },
              }),
              alertData: Types.Object({
                description:
                  "information about all alerts within startDate and endDate, in geojson format",
                properties: {
                  lat: Types.Number(),
                  lng: Types.Number(),
                },
              }),
              vodData: Types.Object({
                description:
                  "information about all vods within startDate and endDate, in geojson format",
                properties: {
                  lat: Types.Number(),
                  lng: Types.Number(),
                },
              }),
            },
          }),
        ),
      },
    },
  },
  true,
);

export default baseLayerApi;
