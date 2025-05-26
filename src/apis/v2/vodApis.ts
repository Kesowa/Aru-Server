import { Request, Router } from "express";
import { Types } from "ts-openapi";

import openApi from "./openApi";
import VOD from "../../models/vod";
import { VODType } from "../../schemas/VOD";
import { missionSpecificSocket } from "../../socket";
import { AuthResponse } from "../../utils/interfaceUtils";

const vodApi = Router();

vodApi.get(
  "/",
  async (
    req: Request & {
      query: {
        missionId?: string;
        flightId?: string;
        locationId?: string;
        isFlagged?: boolean;
        limit: number;
        offset: number;
        orderBy: string;
        asc: boolean;
        populate: string[];
      };
    },
    res: AuthResponse,
  ) => {
    const {
      missionId,
      flightId,
      locationId,
      isFlagged,
      limit,
      offset,
      orderBy,
      asc,
      populate,
    } = req.query;
    const data = await VOD.find(
      {
        tenantId: res.locals.user.tenantId._id,
        [missionId && "missionID"]: missionId,
        [flightId && "flightID"]: flightId,
        [locationId && "locationID"]: locationId,
        [isFlagged && "isFlagged"]: isFlagged,
      },
      {},
      {
        sort: {
          [orderBy]: asc ? "asc" : "desc",
        },
      },
    )
      .skip(offset)
      .limit(limit)
      .populate(populate)
      .lean();

    if (data.length) {
      missionSpecificSocket
        .to(String(missionId))
        .emit("VOD_FETCH", { fetchSucessfully: true });
    }

    res.json({
      data,
      pagination: {
        limit,
        offset,
        count: data.length,
      },
    });
  },
);

openApi.addPath(
  "/vod",
  {
    get: {
      summary: "Get vod data",
      description: "This operation retrieves vod information",
      operationId: "GetVOD",
      requestSchema: {
        query: {
          missionId: Types.String(),
          flightId: Types.String(),
          locationId: Types.String(),
          isFlagged: Types.Boolean(),
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
      tags: ["VOD API"],
      responses: {
        200: openApi.declareSchema("Response Body",
          Types.Object({
            description: "Successful Operation",
            properties: {
              data: Types.Array({ arrayType: VODType }),
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
          }),
        ),
      },
    },
  },
  true,
);

export default vodApi;
