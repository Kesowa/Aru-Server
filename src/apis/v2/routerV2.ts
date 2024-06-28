import { Router } from "express";
import "express-async-errors";
import openApi from "./openApi";
import { writeFileSync } from "fs";
import * as OpenApiValidator from "express-openapi-validator";
import swaggerUi from "swagger-ui-express";
import alertApi from "./alertApis";
import { isAuthenticated } from "../../utils/authUtils";
import missionApi from "./missionApis";
import assetApi from "./assetApis";
import assetClassApi from "./assetClassApis";
import layerApi from "./layerApis";
import baseLayerApi from "./baseLayerApis";
import documentApi from "./documentApis";
import flightApi from "./flightApis";
import clientApi from "./clientApis";
import flightLogApi from "./flightLogApis";
import layerGroupApis from "./layerGroupApis";
import locationApi from "./locationApis";
import manufacturerApi from "./manufacturerApis";
import missionTypeApi from "./missionTypeApis";
import modelApi from "./modelApis";
import organisationApi from "./organisationApis";
import packageApi from "./packageApis";
import paymentApi from "./paymentApis";
import permissionApi from "./permissionApis";
import pilotApi from "./pilotApis";
import rasterApi from "./rasterPropsApis";
import settingApi from "./settingApis";
import streamKeyApi from "./streamTokenApis";
import tenantApi from "./tenantApis";
import threadApi from "./threadApis";
import userApi from "./userApis";
import userGroupApi from "./userGroupApis";
import vectorApi from "./vectorPropsApis";
import vodApi from "./vodApis";

const routerV2 = Router();

const openApiJson = openApi.generateJson();

routerV2.get("/openapi.json", function (_req, res) {
  res.json(openApiJson);
});

routerV2.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiJson));

writeFileSync("/tmp/openapi.json", JSON.stringify(openApiJson));

routerV2.use(
  OpenApiValidator.middleware({
    apiSpec: "/tmp/openapi.json",
    validateRequests: true,
    // validateResponses: true,
  })
);

routerV2.use(isAuthenticated);

routerV2.use("/alert", alertApi);
routerV2.use("/asset", assetApi);
routerV2.use("/assetclass", assetClassApi);
routerV2.use("/baselayer", baseLayerApi);
routerV2.use("/client", clientApi);
routerV2.use("/document", documentApi);
routerV2.use("/flight", flightApi);
routerV2.use("/flightlog", flightLogApi);
routerV2.use("/layer", layerApi);
routerV2.use("/layergroup", layerGroupApis);
routerV2.use("/location", locationApi);
routerV2.use("/manufacturer", manufacturerApi);
routerV2.use("/mission", missionApi);
routerV2.use("/missiontype", missionTypeApi);
routerV2.use("/model", modelApi);
routerV2.use("/organisation", organisationApi);
routerV2.use("/package", packageApi);
routerV2.use("/payment", paymentApi);
routerV2.use("/permission", permissionApi);
routerV2.use("/pilot", pilotApi);
// routerV2.use("/rasterProp", rasterApi);
routerV2.use("/setting", settingApi);
routerV2.use("/streamtoken", streamKeyApi);
routerV2.use("/tenant", tenantApi);
routerV2.use("/thread", threadApi);
routerV2.use("/user", userApi);
routerV2.use("/usergroup", userGroupApi);
// routerV2.use("/vectorProp", vectorApi);
routerV2.use("/vod", vodApi);

// @ts-ignore
routerV2.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    message: err.message,
    errors: err.errors,
  });
});

export default routerV2;
