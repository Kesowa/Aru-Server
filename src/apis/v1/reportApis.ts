import express from "express";

import { isAuthenticated, PermissionGuard } from "../../utils/authUtils";
import {
  generateBlockReport,
  generatePlotReport,
} from "../../controllers/v1/reportController";
import { body } from "express-validator";
import { validator } from "../../utils/requestHelpers";
import { PERMS } from "../../schemas/permission";

const router = express.Router();

router.post(
  "/block",
  isAuthenticated,
  body("missionId").notEmpty().isMongoId(),
  validator,
  PermissionGuard(PERMS.UPLOAD_DOCUMENT),
  generateBlockReport
);

router.post(
  "/plot",
  isAuthenticated,
  body("missionId").notEmpty().isMongoId(),
  validator,
  PermissionGuard(PERMS.UPLOAD_DOCUMENT),
  generatePlotReport
);

export default router;
