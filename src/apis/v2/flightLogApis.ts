/* eslint-disable @typescript-eslint/no-misused-promises */
import { Request, Router } from "express";
import openApi from "./openApi";
import { Types } from "ts-openapi";
import { AuthResponse } from "../../utils/interfaceUtils";
import flightLog from "../../models/flightLog";
import { FlightLogType } from "../../schemas/flightLog";

const flightLogApi = Router();

flightLogApi.get(
  "/",
  async (
    req: Request & {
      query: {
        flightLogId?: string;
        missionId?: string;
        locationId?: string;
        limit: number;
        offset: number;
        orderBy: string;
        asc: boolean;
        populate: string[];
      };
    },
    res: AuthResponse
  ) => {
    const {
      flightLogId,
      missionId,
      locationId,
      limit,
      offset,
      orderBy,
      asc,
      populate,
    } = req.query;
    const data = await flightLog
      .find(
        {
          tenantId: res.locals.user.tenantId._id,
          [flightLogId && "_id"]: flightLogId,
          [missionId && "missionID"]: missionId,
          [locationId && "locationID"]: locationId,
        },
        {},
        {
          sort: {
            [orderBy]: asc ? "asc" : "desc",
          },
        }
      )
      .skip(offset)
      .limit(limit)
      .populate(populate)
      .lean();
    res.json({
      data,
      pagination: {
        limit,
        offset,
        count: data.length,
      },
    });
  }
);

openApi.addPath(
  "/flightlog",
  {
    get: {
      summary: "Get flight log information",
      description: "This operation retrieves flight log information",
      operationId: "GetFlightLog",
      requestSchema: {
        query: {
          flightLogId: Types.String(),
          missionId: Types.String(),
          locationId: Types.String(),
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
      tags: ["Flight Log API"],
      responses: {
        200: openApi.declareSchema(
          "successful response",
          Types.Object({
            description: "Successful Operation",
            properties: {
              data: Types.Array({ arrayType: FlightLogType }),
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
            },
          })
        ),
      },
    },
  },
  true
);

export default flightLogApi;
