import { Request, Router } from "express";
import { Types } from "ts-openapi";

import openApi from "./openApi";
import assetClass from "../../models/assetClass";
import { AssetClassType } from "../../schemas/assetClass";
import { canListAssetClass } from "../../utils/authUtils";
import { AuthResponse } from "../../utils/interfaceUtils";

const assetClassApi = Router();

assetClassApi.get(
  "/",
  canListAssetClass,
  async (
    req: Request & {
      query: {
        assetClassId?: string;
        populate: string[];
      };
    },
    res: AuthResponse
  ) => {
    const { assetClassId, populate } = req.query;
    const data = await assetClass
      .find({
        [assetClassId && "_id"]: assetClassId,
      })
      .populate(populate)
      .lean();
    res.json({
      data,
    });
  }
);

openApi.addPath(
  "/assetclass",
  {
    get: {
      summary: "Get assetclass data",
      description:
        "This operation retrieves assetclass information which specify the types of assets",
      operationId: "GetAssetClass",
      requestSchema: {
        query: {
          assetClassId: Types.String(),
          populate: Types.Array({ arrayType: Types.String() }),
        },
      },
      tags: ["Asset Class API"],
      responses: {
        200: openApi.declareSchema(
          "successful response",
          Types.Object({
            description: "Successful Operation",
            properties: {
              data: Types.Array({ arrayType: AssetClassType }),
            },
          })
        ),
      },
    },
  },
  true
);

export default assetClassApi;
