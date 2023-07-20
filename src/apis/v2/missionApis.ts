/* eslint-disable @typescript-eslint/no-misused-promises */
import { Request, Router } from "express";
import openApi from "./openApi";
import { Types } from "ts-openapi";
import Mission from "../../models/mission";
import { MissionType } from "../../schemas/mission";
import { AuthResponse } from "../../utils/interfaceUtils";

const missionApi = Router();

missionApi.get(
  "/",
  async (
    req: Request & {
      query: {
        missionId?: string;
        createdBy?: string;
        pilotId?: string;
        timespan: [string, string];
        limit: number;
        offset: number;
        orderBy: string;
        asc: boolean;
        populate: string[];
        locationId?: string;
        status?: string;
      };
    },
    res: AuthResponse
  ) => {
    const {
      missionId,
      createdBy,
      pilotId,
      timespan,
      limit,
      offset,
      orderBy,
      asc,
      populate,
      locationId,
      status,
    } = req.query;
    const data = await Mission.find(
      {
        tenantId: res.locals.user.tenantId._id,
        [missionId && "_id"]: missionId,
        [createdBy && "createdBy"]: createdBy,
        [pilotId && "pilotId"]: pilotId,
        [locationId && "locationId"]: locationId,
        [status && "status"]: status,
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
  "/mission",
  {
    get: {
      summary: "Get a mission data",
      description: "This operation retrieves mission information",
      operationId: "GetMission",
      requestSchema: {
        query: {
          missionId: Types.String(),
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
          createdBy: Types.String(),
          pilotId: Types.String(),
          status: Types.String(),
        },
      },
      tags: ["Mission API"],
      responses: {
        200: openApi.declareSchema(
          "successful response",
          Types.Object({
            description: "Successful Operation",
            properties: {
              data: Types.Array({ arrayType: MissionType }),
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

export default missionApi;
