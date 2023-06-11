import { Request, Router } from "express";
import openApi from "./openApi";
import { Types } from "ts-openapi";
import Tenant from "../../models/tenant";
import { TenantType } from "../../schemas/tenant";
import { AuthResponse } from "../../utils/interfaceUtils";
import { onlyTenantRootAccess } from "../../utils/authUtils";

const organisationApi = Router();

organisationApi.get("/", onlyTenantRootAccess, async (req: Request<null, {}, null, {
  populate: string[],
}>, res: AuthResponse) => {
  const { populate } = req.query;
  const data = await Tenant.findById(res.locals.user.tenantId._id)
    .populate(populate)
    .lean();
  res.json({
    data
  })
});

openApi.addPath("/organisation", {
  get: {
    summary: "Get organisation data",
    description: "This operation retrives information about currently logged in user's organisation",
    operationId: "GetOrganisation",
    requestSchema: {
      query: {
        populate: Types.Array({ arrayType: Types.String() }),
      }
    },
    tags: ["Organisation API"],
    responses: {
      200: openApi.declareSchema("successful response",
        Types.Object({
          description: "Successful Operation",
          properties: {
            data: TenantType
          },
        })
      )
    }
  }
}, true)

export default organisationApi;
