import express, { Application } from "express";
import compression from "compression";
import helmet from "helmet";
import path from "path";
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
import rasterPropsApis from "./apis/v1/rasterPropsApis";
import vectorPropsApis from "./apis/v1/vectorPropsApis";
import layerApis from "./apis/v1/layerApis";
import documentApis from "./apis/v1/documentApis";
import webrtcApis from "./apis/v1/webrtcApis";
import clientApis from "./apis/v1/clientApis";
import LayerGroupApis from "./apis/v1/layerGroupApis";
import PaymentApis from "./apis/v1/paymentApis";
import baseLayerApis from "./apis/v1/baseLayerApis";
import settingApis from "./apis/v1/settingApis";

import { Mode, MODE, PUBLIC_DIR } from "./constants";
import morgan from "morgan";
import cors from "cors";
import { pid } from "process";
import { ConsoleLogger } from "./utils/logUtils";

const app: Application = express();

app.use(helmet());
app.use(cors());

//static files
app.use(
  express.static(PUBLIC_DIR, {
    setHeaders: function (res) {
      res.set("x-timestamp", Date.now().toString());
    },
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(compression());
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Logging
const combined = `${pid} :method :url :status :response-time ms - :res[content-length]`;
const dev = `${pid} :method :url :status :response-time ms - :res[content-length]`;
app.use(morgan(MODE == Mode.Dev ? dev : combined));

app.use((_req, res, next) => {
  res.locals.logger = new ConsoleLogger();
  next();
});
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
app.use("/apis/v1/rasterProp", rasterPropsApis);
app.use("/apis/v1/vectorProp", vectorPropsApis);
app.use("/apis/v1/layer", layerApis);
app.use("/apis/v1/document", documentApis);
app.use("/apis/v1/webrtc", webrtcApis);
app.use("/apis/v1/client", clientApis);
app.use("/apis/v1/layergroup", LayerGroupApis);
app.use("/apis/v1/payment", PaymentApis);
app.use("/apis/v1/baselayer", baseLayerApis);
app.use("/apis/v1/setting", settingApis);

// 404 route
app.use(function (req, res, next) {
  // if (req.url.startsWith("/socket.io")) return next();
  console.warn("Trying to handle route, god help us all.");
  if (req.url.split("/").includes("raster")) {
    return res.sendStatus(404);
  }
  if (!req.url.startsWith("/apis/v1")) {
    console.log("url does not starts with /apis/v1");
    res.sendFile(path.join(PUBLIC_DIR, "/index.html"), function (err) {
      if (err) {
        console.error("error sending index.html", err);
        if (res.headersSent) return next();
        return next(err);
      }
    });
  } else {
    next();
  }
});

app.use(errorHandler({ log: true }));

export default app;
