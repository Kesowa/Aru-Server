import { Request, Router } from "express";
import { bodySchema, Types } from "ts-openapi";

import openApi from "./openApi";
import Asset from "../../models/asset";
import { AssetType } from "../../schemas/asset";
import { canListAsset } from "../../utils/authUtils";
import { AuthResponse } from "../../utils/interfaceUtils";

const assetApi = Router();

assetApi.get(
  "/",
  canListAsset,
  async (
    req: Request & {
      query: {
        assetId?: string;
        populate: string[];
      };
    },
    res: AuthResponse,
  ) => {
    const { assetId, populate } = req.query;
    const data = await Asset.find({
      tenantID: res.locals.user.tenantId._id,
      [assetId && "_id"]: assetId,
    })
      .populate(populate)
      .lean();
    res.json({
      data,
    });
  },
);

openApi.addPath(
  "/asset",
  {
    get: {
      summary: "Get asset data",
      description: "This operation retrieves asset(drone) information",
      operationId: "GetAsset",
      requestSchema: {
        query: {
          assetId: Types.String(),
          populate: Types.Array({ arrayType: Types.String() }),
        },
      },
      tags: ["Asset API"],
      responses: {
        200: bodySchema(
          Types.Object({
            description: "Successful Operation",
            properties: {
              data: Types.Array({ arrayType: AssetType }),
            },
          }),
        ),
      },
    },
  },
  true,
);

export default assetApi;
