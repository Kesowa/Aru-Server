import path from "path";

import compression from "compression";
import MongoStore from "connect-mongo";
import cors from "cors";
import errorHandler from "errorhandler";
import express, { Application } from "express";
import session from "express-session";
import helmet from "helmet";
import { Connection } from "mongoose";
import pino, { Logger } from "pino";
import pinoHttp from "pino-http";

//API imports
import aimlApis from "./apis/v1/aimlApis";
import alertApis from "./apis/v1/alertApis";
import assetApis from "./apis/v1/assetApis";
import assetClassApis from "./apis/v1/assetClassApis";
import authApis from "./apis/v1/authApis";
import clientApis from "./apis/v1/clientApis";
import commonApis from "./apis/v1/commonApis";
import packageApis from "./apis/v1/packageApis";
import tenantApis from "./apis/v1/tenantApis";
import organisationApis from "./apis/v1/organisationApis";
import permissionApis from "./apis/v1/permissionApis";
import threadApis from "./apis/v1/threadApis";
import userApis from "./apis/v1/userApis";
import userGroupApis from "./apis/v1/userGroupApis";
import missionTypeApis from "./apis/v1/missionTypeApis";
import missionApis from "./apis/v1/missionApis";
import flightApis from "./apis/v1/flightApis";
import streamTokenApis from "./apis/v1/streamTokenApis";
import VODApis from "./apis/v1/vodAPIs";
import pilotApis from "./apis/v1/pilotApis";
import modelApis from "./apis/v1/modelApis";
import manufacturerApis from "./apis/v1/manufacturerApis";
import locationApis from "./apis/v1/locationApis";
import flightLogApis from "./apis/v1/flightLogApis";
import layerApis from "./apis/v1/layerApis";
import documentApis from "./apis/v1/documentApis";
import LayerGroupApis from "./apis/v1/layerGroupApis";
import PaymentApis from "./apis/v1/paymentApis";
import baseLayerApis from "./apis/v1/baseLayerApis";
import settingApis from "./apis/v1/settingApis";
import dataApis from "./apis/v1/dataApis";
import reportApis from "./apis/v1/reportApis";
import routerV2 from "./apis/v2/routerV2";
import {
  Mode,
  MODE,
  PUBLIC_SERVER,
  SECRET_KEY,
  LOGGER_URL,
  ARU_INSTANCE,
} from "./constants";
import { RateLimiter } from "./utils/rateLimit";

export const logger: Logger = pino({
  name: "ARU-" + ARU_INSTANCE,
  redact: [
    "req.body.password",
    MODE == Mode.Prod ? "req.headers.cookie" : "req.headers",
    "req.body.token",
    MODE == Mode.Prod ? "res.headers['set-cookie']" : "res.headers",
  ],
  transport:
    MODE == Mode.Prod
      ? {
        target: "pino-loki",
        options: {
          batching: true,
          interval: 5,
          host: LOGGER_URL,
          labels: {
            name: "ARU-Server",
          },
        },
      }
      : {
        target: "pino-pretty",
        options: {
          colorize: true,
        },
      },
});

export function SessionMiddleware(mongo: Connection) {
  return session({
    secret: SECRET_KEY,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      client: mongo.getClient(),
      collectionName: "sessions",
    }),
    cookie: {
      httpOnly: true,
      secure: MODE == Mode.Prod,
      maxAge: 1000 * 60 * 60 * 2, // session lasts 2 hours
      sameSite: "strict",
    },
    rolling: true, // Session resets on every request, keeping it active
  });
}

export function LoggerMiddleware() {
  return pinoHttp({
    logger,
    serializers: {
      req(req) {
        req.body = req.raw.body;
        return req;
      }
    },
    customLogLevel: function(_, res, err) {
      if (res.statusCode >= 400 && res.statusCode < 500) {
        return "warn";
      } else if (res.statusCode >= 500 || err) {
        return "error";
      } else if (res.statusCode >= 300 && res.statusCode < 400) {
        return "silent";
      }
      return "info";
    },
  });
}

export default function app(sessionMiddleware: express.RequestHandler, loggerMiddleware: express.RequestHandler) {
  const app: Application = express();

  app.disable("x-powered-by");
  app.use(helmet());

  const limiter = RateLimiter(250);

  app.use(limiter);

  app.get("/", (_, res) => {
    res.status(200).send();
  });
  app.use(compression());
  app.use(
    cors({
      maxAge: 60 * 60 * 24,
      credentials: true,
      origin: PUBLIC_SERVER,
    }),
  );
  app.set("trust proxy", ["loopback", "linklocal", "uniquelocal"]);

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.set("views", path.join(__dirname, "views"));
  app.set("view engine", "ejs");

  app.use(sessionMiddleware);

  app.use(loggerMiddleware);

  app.use("/apis/v2", routerV2);

  //connecting APIs routes
  app.use("/apis/v1/auth", authApis);
  app.use("/apis/v1/admin/tenant", tenantApis);
  app.use("/apis/v1/admin/package", packageApis);
  app.use("/apis/v1/admin/permission", permissionApis);
  app.use("/apis/v1/common", commonApis);
  app.use("/apis/v1/tenantroot", organisationApis);
  app.use("/apis/v1/tenantroot/permission", permissionApis);
  app.use("/apis/v1/tenant/usergroup", userGroupApis);
  app.use("/apis/v1/tenant/user", userApis);
  app.use("/apis/v1/common/missiontype", missionTypeApis);
  app.use("/apis/v1/mission", missionApis);
  app.use("/apis/v1/flight", flightApis);
  app.use("/apis/v1/alert", alertApis);
  app.use("/apis/v1/streamtoken", streamTokenApis);
  app.use("/apis/v1/asset", assetApis);
  app.use("/apis/v1/VOD", VODApis);
  app.use("/apis/v1/pilot", pilotApis);
  app.use("/apis/v1/assetclass", assetClassApis);
  app.use("/apis/v1/model", modelApis);
  app.use("/apis/v1/manufacturer", manufacturerApis);
  app.use("/apis/v1/location", locationApis);
  app.use("/apis/v1/flightlog", flightLogApis);
  app.use("/apis/v1/layer", layerApis);
  app.use("/apis/v1/document", documentApis);
  app.use("/apis/v1/client", clientApis);
  app.use("/apis/v1/layergroup", LayerGroupApis);
  app.use("/apis/v1/payment", PaymentApis);
  app.use("/apis/v1/baselayer", baseLayerApis);
  app.use("/apis/v1/setting", settingApis);
  app.use("/apis/v1/aiml", aimlApis);
  app.use("/apis/v1/thread", threadApis);
  app.use("/apis/v1/data", dataApis);
  app.use("/apis/v1/report", reportApis);

  // 404 route
  app.use(function(req, res, next) {
    if (res.headersSent) return;
    req.log.warn("Trying to handle route, god help us all.");
    if (req.url.split("/").includes("raster")) {
      return res.sendStatus(404);
    }
    if (!req.url.startsWith("/apis/v1")) {
      req.log.info("url does not starts with /apis/v1");
      next();
    }
  });

  app.use(errorHandler({ log: true }));

  return app;
}
