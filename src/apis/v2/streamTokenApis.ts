 
import { Request, Router } from "express";
import { Types } from "ts-openapi";

import openApi from "./openApi";
import { streamKeyModel } from "../../models/streamKey";
import { StreamKeyType } from "../../schemas/streamKey";
import { AuthResponse } from "../../utils/interfaceUtils";

const streamKeyApi = Router();

streamKeyApi.get(
  "/",
  async (
    req: Request & {
      query: {
        isActive?: boolean;
        flightId?: string;
        limit: number;
        offset: number;
        orderBy: string;
        asc: boolean;
        populate: string[];
      };
    },
    res: AuthResponse
  ) => {
    const { isActive, flightId, limit, offset, orderBy, asc, populate } =
      req.query;
    const data = await streamKeyModel
      .find(
        {
          tenantID: res.locals.user.tenantId._id,
          [flightId && "flightID"]: flightId,
          [isActive && "isActive"]: isActive,
        },
        {
          streamKey: 1,
          createdAt: 1,
          createdBy: 1,
          missionID: 1,
          flightID: 1,
        },
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
  "/streamtoken",
  {
    get: {
      summary: "Get stream information",
      description:
        "This operation retrieves stream token and stream information",
      operationId: "GetStreamToken",
      requestSchema: {
        query: {
          isActive: Types.Boolean(),
          flightId: Types.String(),
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
      tags: ["Stream Token API"],
      responses: {
        200: openApi.declareSchema(
          "successful response",
          Types.Object({
            description: "Successful Operation",
            properties: {
              data: Types.Array({ arrayType: StreamKeyType }),
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

export default streamKeyApi;
