import { Request, Router } from "express";
import { HydratedDocument, PipelineStage } from "mongoose";
import { Types } from "ts-openapi";

import openApi from "./openApi";
import Flight from "../../models/flight";
import { FlightType, IFlight } from "../../schemas/flight";
import { AuthResponse } from "../../utils/interfaceUtils";

const flightApi = Router();

flightApi.get(
  "/",
  async (
    req: Request & {
      query: {
        locationId?: string;
        hasNoMission?: boolean;
        limit: number;
        offset: number;
        populate: string[];
      };
    },
    res: AuthResponse,
  ) => {
    const { locationId, hasNoMission, limit, offset, populate } = req.query;
    let data: HydratedDocument<IFlight>[];
    const query: PipelineStage[] = [
      {
        $match: {
          tenant: res.locals.user.tenantId._id,
          [locationId && "locationID"]: locationId,
        },
      },
      { $skip: offset },
      { $limit: limit },
    ];
    if (hasNoMission) {
      query.push(
        {
          $lookup: {
            as: "mission",
            from: "missions",
            localField: "mission",
            foreignField: "_id",
          },
        },
        {
          $match: {
            mission: [],
          },
        },
      );
    }
    data = await Flight.aggregate(query);
    if (hasNoMission) {
      data.forEach((d) => (d.mission = null));
    }
    if (populate?.length > 0) {
      data = await Flight.populate(data, populate.join(","));
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
  "/flight",
  {
    get: {
      summary: "Get flight data",
      description: "This operation retrieves flight information",
      operationId: "GetFlight",
      requestSchema: {
        query: {
          locationId: Types.String(),
          hasNoMission: Types.Boolean(),
          offset: Types.Integer({ minValue: 0, default: 0, required: true }),
          limit: Types.Integer({
            minValue: 0,
            maxValue: 100,
            default: 10,
            required: true,
          }),
          populate: Types.Array({ arrayType: Types.String() }),
        },
      },
      tags: ["Flight API"],
      responses: {
        200: openApi.declareSchema(
          "successful response",
          Types.Object({
            description: "Successful Operation",
            properties: {
              data: Types.Array({ arrayType: FlightType }),
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

export default flightApi;
