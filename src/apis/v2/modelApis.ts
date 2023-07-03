import { Request, Router } from "express";
import openApi from "./openApi";
import { Types } from "ts-openapi";
import Model from "../../models/model";
import { ModelType } from "../../schemas/model";
import { AuthResponse } from "../../utils/interfaceUtils";
import { canListModel } from "../../utils/authUtils";

const modelApi = Router();

modelApi.get(
  "/",
  canListModel,
  async (
    req: Request<
      null,
      {},
      null,
      {
        modelId?: string;
        limit: number;
        offset: number;
        orderBy: string;
        asc: boolean;
        populate: string[];
      }
    >,
    res: AuthResponse
  ) => {
    const { modelId, limit, offset, orderBy, asc, populate } = req.query;
    const data = await Model.find(
      {
        tenantID: res.locals.user.tenantId._id,
        [modelId && "_id"]: modelId,
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
  "/model",
  {
    get: {
      summary: "Get model data",
      description: "This operation retrives device(drone) model information",
      operationId: "GetModel",
      requestSchema: {
        query: {
          modelId: Types.String(),
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
      tags: ["Model API"],
      responses: {
        200: openApi.declareSchema(
          "successful response",
          Types.Object({
            description: "Successful Operation",
            properties: {
              data: Types.Array({ arrayType: ModelType }),
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

export default modelApi;
