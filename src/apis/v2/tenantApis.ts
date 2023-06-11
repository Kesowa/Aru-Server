import { Request, Router } from "express";
import openApi from "./openApi";
import { Types } from "ts-openapi";
import Tenant from "../../models/tenant";
import User from "../../models/user";
import { TenantType } from "../../schemas/tenant";
import { AuthResponse } from "../../utils/interfaceUtils";
import { onlySuperAdminAccess } from "../../utils/authUtils";

const tenantApi = Router();

tenantApi.get("/admin", onlySuperAdminAccess, async (req: Request<null, {}, null, {
  tenantId?: string,
  limit: number,
  offset: number,
  orderBy: string,
  asc: boolean,
  populate: string[],
}>, res: AuthResponse) => {
  const { tenantId, limit, offset, orderBy, asc, populate } = req.query;
  const data = await Tenant.find(
    {
      [tenantId && "_id"]: tenantId,
    }, {}, {
    sort: {
      [orderBy]: asc ? "asc" : "desc",
    }
  })
    .skip(offset)
    .limit(limit)
    .populate(populate)
    .lean();

  if(tenantId) {
    const tenantRoot = await User.findOne({ 
      tenantId: tenantId, 
      userType: "tenant-root" 
    })
    .select("name email phoneNo")
    .lean();
    data[0].tenantRoot = tenantRoot;
  }

  res.json({
    data,
    pagination: {
      limit,
      offset,
      count: data.length
    }
  })
});
tenantApi.get("/", async (req: Request<null, {}, null, {
  populate: string[],
}>, res: AuthResponse) => {
  const { populate } = req.query;
  const data = await Tenant.findById(res.locals.user.tenantId._id)
    .populate(populate);
  res.json({
    data
  })
});

openApi.addPath("/tenant/admin", {
  get: {
    summary: "Get tenant data for admin",
    description: "This operation retrives all tenants' information",
    operationId: "GetTenantAdmin",
    requestSchema: {
      query: {
        populate: Types.Array({ arrayType: Types.String() }),
      }
    },
    tags: ["Tenant API"],
    responses: {
      200: openApi.declareSchema("successful response",
        Types.Object({
          description: "Successful Operation",
          properties: {
            data: Types.Array({ arrayType: TenantType }), 
            pagination: Types.Object({
              description: "pagination information for data",
              properties: {
                offset: Types.Integer({ minValue: 0 }),
                limit: Types.Integer({ minValue: 0, maxValue: 100, default: 10 }),
                count: Types.Integer({ minValue: 0, maxValue: 100, default: 10 })
              }
            })
          },
        })
      )
    }
  }
}, true)

openApi.addPath("/tenant", {
  get: {
    summary: "Get tenant data for user",
    description: "This operation retrives current tenant's information",
    operationId: "GetTenant",
    requestSchema: {
      query: {
        populate: Types.Array({ arrayType: Types.String() }),
      }
    },
    tags: ["Tenant API"],
    responses: {
      200: openApi.declareSchema("successful response",
        Types.Object({
          description: "Successful Operation",
          properties: {
            data: TenantType, 
          },
        })
      )
    }
  }
}, true)

export default tenantApi;
