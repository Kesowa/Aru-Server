import pino, { Logger } from "pino";
import pinoHttp from "pino-http";
import express, { Application } from "express";
import compression from "compression";
import helmet from "helmet";
import path from "path";
import session from "express-session";
import MongoStore from "connect-mongo";
import errorHandler from "errorhandler";

//API imports
import authApis from "./apis/v1/authApis";
import tenantApis from "./apis/v1/tenantApis";
import packageApis from "./apis/v1/packageApis";
import commonApis from "./apis/v1/commonApis";
import organisationApis from "./apis/v1/organisationApis";
import permissionApis from "./apis/v1/permissionApis";
import userGroupApis from "./apis/v1/userGroupApis";
import userApis from "./apis/v1/userApis";
import missionTypeApis from "./apis/v1/missionTypeApis";
import missionApis from "./apis/v1/missionApis";
import flightApis from "./apis/v1/flightApis";
import alertApis from "./apis/v1/alertApis";
import streamTokenApis from "./apis/v1/streamTokenApis";
import assetApis from "./apis/v1/assetApis";
import assetClassApis from "./apis/v1/assetClassApis";
import VODApis from "./apis/v1/vodAPIs";
import pilotApis from "./apis/v1/pilotApis";
import modelApis from "./apis/v1/modelApis";
import manufacturerApis from "./apis/v1/manufacturerApis";
import locationApis from "./apis/v1/locationApis";
import flightLogApis from "./apis/v1/flightLogApis";
import layerApis from "./apis/v1/layerApis";
import documentApis from "./apis/v1/documentApis";
import clientApis from "./apis/v1/clientApis";
import LayerGroupApis from "./apis/v1/layerGroupApis";
import PaymentApis from "./apis/v1/paymentApis";
import baseLayerApis from "./apis/v1/baseLayerApis";
import settingApis from "./apis/v1/settingApis";
import aimlApis from "./apis/v1/aimlApis";
import threadApis from "./apis/v1/threadApis";
import dataApis from "./apis/v1/dataApis";
import reportApis from "./apis/v1/reportApis";

import {
  ARU_INSTANCE,
  Mode,
  MODE,
  PUBLIC_SERVER,
  SECRET_KEY,
  SEQ_API_KEY,
  SEQ_SERVER_URL,
} from "./constants";
import cors from "cors";
import routerV2 from "./apis/v2/routerV2";
import rateLimit from "express-rate-limit";
import { Connection } from "mongoose";

export let logger: Logger;

export default function app(mongo: Connection) {
  const app: Application = express();

  const limiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    limit: 250,
    standardHeaders: "draft-7",
    legacyHeaders: false,
  });

  app.use(limiter);

  app.get("/", (_, res) => {
    res.status(200).send();
  });
  app.use(compression());
  app.use(
    helmet({
      frameguard: false,
    })
  );
  app.use(
    cors({
      maxAge: 60 * 60 * 24,
      credentials: true,
      origin: PUBLIC_SERVER,
    })
  );
  app.set("trust proxy", ["loopback", "linklocal", "uniquelocal"]);

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.set("views", path.join(__dirname, "views"));
  app.set("view engine", "ejs");

  if (MODE == Mode.Prod) {
    const seqConfig = {
      serverUrl: SEQ_SERVER_URL,
      apiKey: SEQ_API_KEY,
    };

    logger = pino({
      name: ARU_INSTANCE,
      transport: {
        target: "@autotelic/pino-seq-transport",
        options: {
          loggerOpts: seqConfig,
        },
      },
      redact: ["req.body.password", "req.headers.authorization"],
    });
  } else {
    logger = pino({
      name: ARU_INSTANCE,
      transport: {
        target: "pino-pretty",
        options: {
          colorize: true,
        },
      },
      redact: ["res.headers", "req.headers"],
    });
  }

  app.use(
    session({
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
        maxAge: 1000 * 60 * 60,
        sameSite: "strict",
      },
    })
  );

  app.use(
    pinoHttp({
      logger,

      genReqId: function(req, _) {
        return (req.ip);
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
      serializers: {
        req(req) {
          req.body = req.raw.body;
          return req;
        },
      },
      quietReqLogger: true,
      customErrorMessage: (req, _, err) => {
        return `${req.method} ${req["originalUrl"]} ${err.message}`;
      },
      customReceivedMessage: (req, _) => {
        return `${req.method} ${req["originalUrl"]}`;
      },
      customSuccessMessage: (req, _, responseTime) => {
        return `${req.method} ${req["originalUrl"]} in ${responseTime}ms`;
      },
    })
  );

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
  // app.use("/apis/v1/rasterProp", rasterPropsApis);
  // app.use("/apis/v1/vectorProp", vectorPropsApis);
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
    // if (req.url.startsWith("/socket.io")) return next();
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
