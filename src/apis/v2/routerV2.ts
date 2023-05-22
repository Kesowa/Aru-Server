import { Router } from "express";
import "express-async-errors";
import openApi from "./openApi";
import { writeFileSync } from "fs";
import * as OpenApiValidator from "express-openapi-validator";
import swaggerUi from "swagger-ui-express";
import alertApi from "./alertApis";
import { isAuthenticated } from "../../utils/authUtils";

const routerV2 = Router();

const openApiJson = openApi.generateJson();

routerV2.get("/openapi.json", function(_req, res) {
  res.json(openApiJson);
});

routerV2.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiJson));

writeFileSync("/tmp/openapi.json", JSON.stringify(openApiJson));

routerV2.use(OpenApiValidator.middleware({
  apiSpec: "/tmp/openapi.json",
  validateRequests: true,
  // validateResponses: true,
}))

// routerV2.use(isAuthenticated);

routerV2.use("/alert", alertApi);

// @ts-ignore
routerV2.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    message: err.message,
    errors: err.errors,
  })
})

export default routerV2;
