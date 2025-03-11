import { Request, Router } from "express";
import { Types } from "ts-openapi";

import openApi from "./openApi";
import Package from "../../models/package";
import { PackageType } from "../../schemas/package";
import { onlySuperAdminAccess } from "../../utils/authUtils";
import { AuthResponse } from "../../utils/interfaceUtils";

const packageApi = Router();

packageApi.get(
  "/",
  onlySuperAdminAccess,
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
    res: AuthResponse,
  ) => {
    const { isActive, limit, offset, orderBy, asc, populate } = req.query;
    const data = await Package.find(
      {
        [isActive && "isActive"]: isActive,
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
  "/package",
  {
    get: {
      summary: "Get package data",
      description: "This operation retrieves package information",
      operationId: "GetPackage",
      requestSchema: {
        query: {
          isActive: Types.Boolean(),
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
      tags: ["Package API"],
      responses: {
        200: openApi.declareSchema(
          "successful response",
          Types.Object({
            description: "Successful Operation",
            properties: {
              data: Types.Array({ arrayType: PackageType }),
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

export default packageApi;
