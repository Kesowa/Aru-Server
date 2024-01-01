import express from "express";

import { isAuthenticated } from "../../utils/authUtils";
import { generatePlotReport, generateReport } from "../../controllers/v1/reportController";
import { body } from "express-validator";
import { validator } from "../../utils/requestHelpers";

const router = express.Router();

router.post(
  "/block",
  isAuthenticated,
  body("missionId").notEmpty().isMongoId(),
  validator,
  generateReport
);

router.post(
  "/plot",
  isAuthenticated,
  body("missionId").notEmpty().isMongoId(),
  validator,
  generatePlotReport
);

export default router;
