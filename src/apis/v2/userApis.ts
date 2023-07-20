import { Request, Router } from "express";
import openApi from "./openApi";
import { Types } from "ts-openapi";
import User from "../../models/user";
import { UserType } from "../../schemas/user";
import { AuthResponse } from "../../utils/interfaceUtils";
import { canListUsers } from "../../utils/authUtils";
import ObjectsToCsv from "objects-to-csv";
import { Directory, DirPath } from "../../constants";

const userApi = Router();

userApi.get(
  "/",
  canListUsers,
  async (
    req: Request & {
      query: {
        genCSV?: boolean;
        limit: number;
        offset: number;
        orderBy: string;
        asc: boolean;
        populate: string[];
      };
    },
    res: AuthResponse
  ) => {
    const { genCSV, limit, offset, orderBy, asc, populate } = req.query;
    const data = await User.find(
      {
        tenantId: res.locals.user.tenantId._id,
        userType: { $ne: "tenant-client" },
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

    const resp: any = {
      data,
      pagination: {
        limit,
        offset,
        count: data.length,
      },
    };

    if (genCSV && data.length) {
      const csv = new ObjectsToCsv(data);
      const file = DirPath(
        Directory.CSV,
        `${Math.floor(Math.random() * 62000000)}.csv`
      );
      await csv.toDisk(file);
      resp.csvPath =
        "/" +
        file
          .split(/[\\\/]/)
          .slice(8)
          .join("/");
    }

    res.json(resp);
  }
);

openApi.addPath(
  "/user",
  {
    get: {
      summary: "Get user data",
      description: "This operation retrieves user information",
      operationId: "GetUser",
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
      tags: ["User API"],
      responses: {
        200: openApi.declareSchema(
          "successful response",
          Types.Object({
            description: "Successful Operation",
            properties: {
              data: Types.Array({ arrayType: UserType }),
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

export default userApi;
