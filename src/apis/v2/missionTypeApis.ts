/* eslint-disable @typescript-eslint/no-misused-promises */
import { Request, Router } from "express";
import openApi from "./openApi";
import { Types } from "ts-openapi";
import MissionType from "../../models/missionType";
import { MissionTypeType } from "../../schemas/missonType";
import { AuthResponse } from "../../utils/interfaceUtils";

const missionTypeApi = Router();

missionTypeApi.get(
  "/",
  async (
    req: Request & {
      query: {
        isActive: boolean;
        limit: number;
        offset: number;
        orderBy: string;
        asc: boolean;
        populate: string[];
      };
    },
    res: AuthResponse
  ) => {
    const { isActive, limit, offset, orderBy, asc, populate } = req.query;
    const data = await MissionType.find(
      {
        [isActive && "isActive"]: isActive,
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
  "/missiontype",
  {
    get: {
      summary: "Get mission types data",
      description: "This operation retrieves the different types of missions",
      operationId: "GetMissionType",
      requestSchema: {
        query: {
          isActive: Types.Boolean(),
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
        },
      },
      tags: ["Mission Type API"],
      responses: {
        200: openApi.declareSchema(
          "successful response",
          Types.Object({
            description: "Successful Operation",
            properties: {
              data: Types.Array({ arrayType: MissionTypeType }),
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

export default missionTypeApi;
