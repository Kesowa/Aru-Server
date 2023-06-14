import { Request, Router } from "express";
import openApi from "./openApi";
import { Types } from "ts-openapi";
import Payment from "../../models/payment";
import { PaymentType } from "../../schemas/payment";
import { AuthResponse } from "../../utils/interfaceUtils";
import { Mode } from "../../constants";
import { environmentGuard } from "../../utils/requestHelpers";

const paymentApi = Router();

paymentApi.get(
  "/",
  environmentGuard(Mode.Dev),
  async (
    req: Request<
      null,
      {},
      null,
      {
        limit: number;
        offset: number;
        orderBy: string;
        asc: boolean;
        populate: string[];
      }
    >,
    res: AuthResponse
  ) => {
    const { limit, offset, orderBy, asc, populate } = req.query;
    const data = await Payment.find(
      {
        tenant: res.locals.user.tenantId._id,
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
  "/payment",
  {
    get: {
      summary: "Get payment data",
      description:
        "This operation retrives information about all payments of current tenant (tenant under whom current user is)",
      operationId: "GetPayment",
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
      tags: ["Payment API"],
      responses: {
        200: openApi.declareSchema(
          "successful response",
          Types.Object({
            description: "Successful Operation",
            properties: {
              data: Types.Array({ arrayType: PaymentType }),
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

export default paymentApi;
