import { Request, Router } from "express";
import openApi from "./openApi";
import { Types } from "ts-openapi";
import UserGroup from "../../models/usergroup";
import { UserGroupType } from "../../schemas/usergroup";
import { AuthResponse } from "../../utils/interfaceUtils";
import { canListUserGroup } from "../../utils/authUtils";

const userGroupApi = Router();

userGroupApi.get(
  "/",
  canListUserGroup,
  async (
    req: Request<
      null,
      {},
      null,
      {
        userGroupId?: string;
        limit: number;
        offset: number;
        orderBy: string;
        asc: boolean;
        populate: string[];
      }
    >,
    res: AuthResponse
  ) => {
    const { userGroupId, limit, offset, orderBy, asc, populate } = req.query;
    const data = await UserGroup.find(
      {
        tenantId: res.locals.user.tenantId._id,
        [userGroupId && "_id"]: userGroupId,
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
  "/usergroup",
  {
    get: {
      summary: "Get usergroup data",
      description: "This operation retrives usergroup information",
      operationId: "GetUserGroup",
      requestSchema: {
        query: {
          userGroupId: Types.String(),
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
      tags: ["UserGroup API"],
      responses: {
        200: openApi.declareSchema(
          "successful response",
          Types.Object({
            description: "Successful Operation",
            properties: {
              data: Types.Array({ arrayType: UserGroupType }),
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

export default userGroupApi;
