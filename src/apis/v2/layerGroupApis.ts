import { Request, Router } from "express";
import openApi from "./openApi";
import { Types } from "ts-openapi";
import { AuthResponse } from "../../utils/interfaceUtils";
import LayerGroup from "../../models/layerGroup";
import { LayerGroupType } from "../../schemas/layerGroup";

const layerGroupApis = Router();

layerGroupApis.get(
  "/",
  async (
    req: Request<
      null,
      {},
      null,
      {
        layerGroupId?: string;
        limit: number;
        offset: number;
        orderBy: string;
        asc: boolean;
        populate: string[];
      }
    >,
    res: AuthResponse
  ) => {
    const { layerGroupId, limit, offset, orderBy, asc, populate } = req.query;
    const data = await LayerGroup.find(
      {
        tenantId: res.locals.user.tenantId._id,
        [layerGroupId && "_id"]: layerGroupId,
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
  "/layergroup",
  {
    get: {
      summary: "Get layer group information",
      description: "This operation retrives layer group information",
      operationId: "GetLayerGroup",
      requestSchema: {
        query: {
          layerGroupId: Types.String(),
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
      tags: ["Layer Group API"],
      responses: {
        200: openApi.declareSchema(
          "successful response",
          Types.Object({
            description: "Successful Operation",
            properties: {
              data: Types.Array({ arrayType: LayerGroupType }),
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

export default layerGroupApis;
