import { Request, Router } from "express";
import { Types } from "ts-openapi";

import openApi from "./openApi";
import { PERMS } from "../../schemas/permission";
import { AuthResponse } from "../../utils/interfaceUtils";

const permissionApi = Router();

permissionApi.get(
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
    const { limit, offset } = req.query;
    if (["super-admin", "tenant-root"].includes(res.locals.user.userType)) {
      const data = Object.values(PERMS);
      res.json({
        data,
        pagination: {
          limit,
          offset,
          count: data.length,
        },
      });
    } else {
      throw new Error("Access Denied");
    }
  },
);

openApi.addPath(
  "/permission",
  {
    get: {
      summary: "Get a permission data",
      description: "This operation retrieves permission information",
      operationId: "GetPermission",
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
      tags: ["Permission API"],
      responses: {
        200: openApi.declareSchema("Response Body",
          Types.Object({
            description: "Successful Operation",
            properties: {
              data: Types.Array({
                arrayType: Types.StringEnum({ values: Object.values(PERMS) }),
              }),
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

export default permissionApi;
