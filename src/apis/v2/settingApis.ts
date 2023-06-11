import { Request, Router } from "express";
import openApi from "./openApi";
import { Types } from "ts-openapi";
import { AuthResponse } from "../../utils/interfaceUtils";
import {
  API_SERVER,
  LIVE_URL,
  RTMP_PUBLIC,
  TITILER_PUBLIC,
} from "../../constants";

const settingApi = Router();

settingApi.get("/", (req: Request, res: AuthResponse) => {
  res.json({
    RTMP_URL: RTMP_PUBLIC,
    STREAM_URL: LIVE_URL,
    COG_URL: TITILER_PUBLIC,
    SERVER_URL: API_SERVER,
  });
});

openApi.addPath("/setting", {
  get: {
    summary: "Get setting data",
    description: "This operation retrives server configuration and settings information",
    operationId: "GetSetting",
    requestSchema: {},
    tags: ["Setting API"],
    responses: {
      200: openApi.declareSchema("successful response",
        Types.Object({
          description: "Successful Operation",
          properties: {
            RTMP_URL: Types.String(),
            STREAM_URL: Types.String(),
            COG_URL: Types.String(),
            SERVER_URL: Types.String(),
          },
        })
      )
    }
  }
}, true)

export default settingApi;
