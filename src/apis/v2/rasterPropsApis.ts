import { Request, Router } from "express";
import openApi from "./openApi";
import { Types } from "ts-openapi";
import Raster from "../../models/rasterprops";
import { RasterType } from "../../schemas/rasterprops";
import { AuthResponse } from "../../utils/interfaceUtils";

const rasterApi = Router();

rasterApi.get(
  "/",
  async (
    req: Request<
      null,
      {},
      null,
      {
        rasterPropId?: string;
        limit: number;
        offset: number;
        orderBy: string;
        asc: boolean;
        populate: string[];
      }
    >,
    res: AuthResponse
  ) => {
    const { rasterPropId, limit, offset, orderBy, asc, populate } = req.query;
    const data = await Raster.find(
      {
        [rasterPropId && "_id"]: rasterPropId,
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
  "/rasterProp",
  {
    get: {
      summary: "Get raster prop data",
      description:
        "This operation retrives information about different types of rasters",
      operationId: "GetRasterProp",
      requestSchema: {
        query: {
          rasterPropId: Types.String(),
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
      tags: ["Raster Prop API"],
      responses: {
        200: openApi.declareSchema(
          "successful response",
          Types.Object({
            description: "Successful Operation",
            properties: {
              data: Types.Array({ arrayType: RasterType }),
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

export default rasterApi;
