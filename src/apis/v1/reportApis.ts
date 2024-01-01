import express from "express";

import { isAuthenticated } from "../../utils/authUtils";
import { generatePlotReport, generateReport } from "../../controllers/v1/reportController";
import { body } from "express-validator";
import { validator } from "../../utils/requestHelpers";

const router = express.Router();

router.post(
  "/",
  isAuthenticated,
  body("missionId").notEmpty().isMongoId(),
  validator,
  generateReport
);

router.post(
  "/plot-report",
  // isAuthenticated,
  body("rasterLayerId").notEmpty().isString(),
  body("plotLayerId").notEmpty().isString(),
  body("buildingLayerId").notEmpty().isString(),
  body("blockLayerId").notEmpty().isString(),
  body("greeneryLayerId").notEmpty().isString(),
  body("canopyLayerId").notEmpty().isString(),
  body("waterbodyLayerId").notEmpty().isString(),
  validator,
  generatePlotReport
);

export default router;
