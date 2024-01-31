/* eslint-disable @typescript-eslint/no-misused-promises */
import { Request, Router } from "express";
import openApi from "./openApi";
import { Types } from "ts-openapi";
import Alert from "../../models/alert";
import { AlertType } from "../../schemas/alert";
import { AuthResponse } from "../../utils/interfaceUtils";

const alertApi = Router();

alertApi.get(
  "/",
  async (
    req: Request & {
      query: {
        alertId?: string;
        missionId?: string;
        flightId?: string;
        timespan: [string, string];
        limit: number;
        offset: number;
        orderBy: string;
        asc: boolean;
        populate: string[];
        locationId?: string;
      };
    },
    res: AuthResponse
  ) => {
    const {
      alertId,
      missionId,
      flightId,
      timespan,
      limit,
      offset,
      orderBy,
      asc,
      populate,
      locationId,
    } = req.query;
    const data = await Alert.find(
      {
        tenantId: res.locals.user.tenantId._id,
        [alertId && "_id"]: alertId,
        [missionId && "missionId"]: missionId,
        [flightId && "flightId"]: flightId,
        [locationId && "locationId"]: locationId,
        [timespan?.length && "createdAt"]: {
          $gte: timespan?.[0],
          $lte: timespan?.[1],
        },
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
  "/alert",
  {
    get: {
      summary: "Get an alert data",
      description: "This operation retrieves alert/drone image information",
      operationId: "GetAlert",
      requestSchema: {
        query: {
          alertId: Types.String(),
          missionId: Types.String(),
          flightId: Types.String(),
          timespan: Types.Array({
            arrayType: Types.DateTime(),
            minLength: 2,
            maxLength: 2,
          }),
          offset: Types.Integer({ minValue: 0, default: 0, required: true }),
          limit: Types.Integer({
            minValue: 0,
            maxValue: 100,
            default: 10,
            required: true,
          }),
          orderBy: Types.String({ default: "createdAt", required: true }),
          asc: Types.Boolean({ default: false, required: true }),
          populate: Types.Array({ arrayType: Types.String() }),
          locationId: Types.String(),
        },
      },
      tags: ["Alert API"],
      responses: {
        200: openApi.declareSchema(
          "successful response",
          Types.Object({
            description: "Successful Operation",
            properties: {
              data: Types.Array({ arrayType: AlertType }),
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

export default alertApi;
