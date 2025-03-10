import express from "express";
import { body } from "express-validator";

import {
  generateBlockReport,
  generatePlotReport,
} from "../../controllers/v1/reportController";
import { PERMS } from "../../schemas/permission";
import { isAuthenticated, PermissionGuard } from "../../utils/authUtils";
import { validator } from "../../utils/requestHelpers";

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
