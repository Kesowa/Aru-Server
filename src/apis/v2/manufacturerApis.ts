/* eslint-disable @typescript-eslint/no-misused-promises */
import { Request, Router } from "express";
import openApi from "./openApi";
import { Types } from "ts-openapi";
import { AuthResponse } from "../../utils/interfaceUtils";
import Manufacturer from "../../models/manufacturer";
import { ManufacturerType } from "../../schemas/manufacturer";

const manufacturerApi = Router();

manufacturerApi.get(
  "/",
  async (
    req: Request & {
      query: {
        manufacturerId?: string;
        limit: number;
        offset: number;
        orderBy: string;
        asc: boolean;
        populate: string[];
      };
    },
    res: AuthResponse,
  ) => {
    const { manufacturerId, limit, offset, orderBy, asc, populate } = req.query;
    const data = await Manufacturer.find(
      {
        tenantId: res.locals.user.tenantId._id,
        [manufacturerId && "_id"]: manufacturerId,
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
  "/manufacturer",
  {
    get: {
      summary: "Get manufacturer information",
      description: "This operation retrieves manufacturer information",
      operationId: "GetManufacturer",
      requestSchema: {
        query: {
          manufacturerId: Types.String(),
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
      tags: ["Manufacturer API"],
      responses: {
        200: openApi.declareSchema(
          "successful response",
          Types.Object({
            description: "Successful Operation",
            properties: {
              data: Types.Array({ arrayType: ManufacturerType }),
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

export default manufacturerApi;
