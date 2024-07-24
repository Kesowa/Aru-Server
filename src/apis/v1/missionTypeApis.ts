import express from "express";
import { body } from "express-validator";
import {
  createMissionType,
  fetchAllMissionTypes,
  editMissionType,
  deleteMissionType,
} from "../../controllers/v1/missionTypeControllers";
import { isAuthenticated, PermissionGuard } from "../../utils/authUtils";
import { validator, RobustRunner } from "../../utils/requestHelpers";
import { PERMS } from "../../schemas/permission";

const router = express.Router();

//++++++++++++++++++++ create mission type Api++++++++++++++++++++++++
router.post(
  "/create",
  isAuthenticated,
  body("name").notEmpty().trim(),
  body("description").notEmpty().trim(),
  validator,
  PermissionGuard(PERMS.MISSION_TYPE_CREATE),
  RobustRunner(createMissionType)
);

//++++++++++++++++++++ edit mission type Api++++++++++++++++++++++++
router.post(
  "/edit",
  isAuthenticated,
  body("name").notEmpty().trim(),
  body("description").notEmpty().trim(),
  body("_id").notEmpty().isMongoId(),
  body("isActive")
    .optional()
    .exists({ checkFalsy: true })
    .isBoolean()
    .toBoolean(),
  validator,
  PermissionGuard(PERMS.MISSION_TYPE_UPDATE),
  RobustRunner(editMissionType)
);

//++++++++++++++++++++ delete mission type Api++++++++++++++++++++++++
router.post(
  "/delete",
  isAuthenticated,
  body("_id").notEmpty().isMongoId(),
  validator,
  PermissionGuard(PERMS.MISSION_TYPE_DELETE),
  RobustRunner(deleteMissionType)
);

//++++++++++++++++++++ fetch all mission type Api++++++++++++++++++++++++
router.get("/getall", isAuthenticated, PermissionGuard(PERMS.MISSION_TYPE_LIST), RobustRunner(fetchAllMissionTypes));

export default router;
