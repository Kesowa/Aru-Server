import { Request, Router } from "express";
import { Types } from "ts-openapi";

import openApi from "./openApi";
import User from "../../models/user";
import { IPermission } from "../../schemas/permission";
import { UserType } from "../../schemas/user";
import { AuthResponse } from "../../utils/interfaceUtils";

const pilotApi = Router();

pilotApi.get(
  "/",
  async (
    req: Request & {
      query: {
        limit: number;
        offset: number;
        orderBy: string;
        asc: boolean;
        populate: string[];
      };
    },
    res: AuthResponse,
  ) => {
    const { limit, offset, orderBy, asc, populate } = req.query;
    const data = await User.find(
      {
        tenantId: res.locals.user.tenantId._id,
        userGroupId: { $exists: true },
      },
      {},
      {
        sort: {
          [orderBy]: asc ? "asc" : "desc",
        },
      },
    )
      .populate<{ userGroupId: { permissions: IPermission[] } }>({
        path: "userGroupId",
        select: "permissions",
        populate: {
          path: "permissions",
          select: "isPilot",
          match: { isPilot: true },
        },
      })
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
  },
);

openApi.addPath(
  "/pilot",
  {
    get: {
      summary: "Get pilot data",
      description: "This operation retrieves pilot information",
      operationId: "GetPilot",
      requestSchema: {
        query: {
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
      tags: ["Pilot API"],
      responses: {
        200: openApi.declareSchema(
          "successful response",
          Types.Object({
            description: "Successful Operation",
            properties: {
              data: Types.Array({ arrayType: UserType }),
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
          }),
        ),
      },
    },
  },
  true,
);

export default pilotApi;
