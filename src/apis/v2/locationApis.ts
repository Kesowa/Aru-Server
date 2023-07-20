/* eslint-disable @typescript-eslint/no-misused-promises */
import { Request, Router } from "express";
import openApi from "./openApi";
import { Types } from "ts-openapi";
import { AuthResponse } from "../../utils/interfaceUtils";
import Location from "../../models/location";
import { LocationType } from "../../schemas/location";

const locationApi = Router();

locationApi.get(
  "/",
  async (
    req: Request & {
      query: {
        locationId?: string;
        lat?: number;
        lng?: number;
        getWithin?: boolean;
        limit: number;
        offset: number;
        orderBy: string;
        asc: boolean;
        populate: string[];
      };
    },
    res: AuthResponse,
  ) => {
    const {
      locationId,
      lat,
      lng,
      getWithin,
      limit,
      offset,
      orderBy,
      asc,
      populate,
    } = req.query;
    const data = await Location.find(
      {
        tenantId: res.locals.user.tenantId._id,
        [locationId && "_id"]: locationId,
        [lat && "geometry.coordinates.lat"]: lat,
        [lng && "geometry.coordinates.lng"]: lng,
      },
      {},
      {
        sort: {
          [orderBy]: asc ? "asc" : "desc",
        },
      },
    )
      .skip(offset)
      .limit(limit)
      .populate(populate)
      .lean();

    const resp: any = {
      data,
      pagination: {
        limit,
        offset,
        count: data.length,
      },
    };

    if (getWithin && locationId) {
      const enclosedLocations = await Location.find({
        geometry: {
          $geoWithin: {
            $geometry: {
              ...data[0].geometry,
            },
          },
        },
        tenantId: res.locals.user.tenantId._id,
      });
      resp.enclosedLocations = enclosedLocations;
    }

    res.json(resp);
  },
);

openApi.addPath(
  "/location",
  {
    get: {
      summary: "Get location information",
      description: "This operation retrieves location information",
      operationId: "GetLocation",
      requestSchema: {
        query: {
          locationId: Types.String(),
          lat: Types.Number(),
          lng: Types.Number(),
          getWithin: Types.Boolean(),
          limit: Types.Integer({
            minValue: 0,
            maxValue: 100,
            default: 10,
            required: true,
          }),
          offset: Types.Integer({ minValue: 0, default: 0, required: true }),
          orderBy: Types.String({ default: "createdAt", required: true }),
          asc: Types.Boolean({ default: false, required: true }),
          populate: Types.Array({ arrayType: Types.String() }),
        },
      },
      tags: ["Location API"],
      responses: {
        200: openApi.declareSchema(
          "successful response",
          Types.Object({
            description: "Successful Operation",
            properties: {
              data: Types.Array({ arrayType: LocationType }),
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
              enclosedLocations: Types.Array({
                description:
                  "Locations that are enclosed by the location whose id is passed in query",
                arrayType: LocationType,
              }),
            },
          }),
        ),
      },
    },
  },
  true,
);

export default locationApi;
