import express from "express";
import { body } from "express-validator";
import {
  createMissionType,
  fetchAllMissionTypes,
  editMissionType,
  deleteMissionType,
} from "../../controllers/v1/missionTypeControllers";
import { isAuthenticated, onlySuperAdminAccess } from "../../utils/authUtils";
import { validator, RobustRunner } from "../../utils/requestHelpers";

const router = express.Router();

//++++++++++++++++++++ create mission type Api++++++++++++++++++++++++
router.post(
  "/create",
  isAuthenticated,
  onlySuperAdminAccess,
  body("name").notEmpty().trim(),
  body("description").notEmpty().trim(),
  validator,
  RobustRunner(createMissionType)
);

//++++++++++++++++++++ edit mission type Api++++++++++++++++++++++++
router.post(
  "/edit",
  isAuthenticated,
  onlySuperAdminAccess,
  body("name").notEmpty().trim(),
  body("description").notEmpty().trim(),
  body("_id").notEmpty().isMongoId(),
  body("isActive")
    .optional()
    .exists({ checkFalsy: true })
    .isBoolean()
    .toBoolean(),
  validator,
  RobustRunner(editMissionType)
);

//++++++++++++++++++++ delete mission type Api++++++++++++++++++++++++
router.post(
  "/delete",
  isAuthenticated,
  onlySuperAdminAccess,
  body("_id").notEmpty().isMongoId(),
  validator,
  RobustRunner(deleteMissionType)
);

//++++++++++++++++++++ fetch all mission type Api++++++++++++++++++++++++
router.get("/getall", isAuthenticated, RobustRunner(fetchAllMissionTypes));

export default router;
