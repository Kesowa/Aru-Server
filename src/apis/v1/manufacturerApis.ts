import express from "express";
import { body, header, query } from "express-validator";
import {
  createManufacturer,
  fetchManufacturerbyId,
  getManufacturer,
  removeManufacturer,
  updateManufacturer,
} from "../../controllers/v1/manufacturerController";
import { isAuthenticated, PermissionGuard } from "../../utils/authUtils";
import { validator, RobustRunner } from "../../utils/requestHelpers";
import { PERMS } from "../../schemas/permission";

const router = express.Router();

router.post(
  "/create",
  isAuthenticated,
  body("name").notEmpty().trim(),
  body("address").notEmpty().trim(),
  body("nationality").notEmpty().trim(),
  body("website").notEmpty().trim(),
  body("contacts").notEmpty().isArray({ min: 1 }),
  header("userid").notEmpty().isMongoId(),
  validator,
  PermissionGuard(PERMS.MANUFACTURER_CREATE),
  RobustRunner(createManufacturer)
);

router.get(
  "/get",
  isAuthenticated,
  PermissionGuard(PERMS.MANUFACTURER_LIST),
  RobustRunner(getManufacturer)
);

router.get(
  "/get-by-id",
  isAuthenticated,
  query("_id").notEmpty().isMongoId(),
  validator,
  PermissionGuard(PERMS.MANUFACTURER_LIST),
  RobustRunner(fetchManufacturerbyId)
);

router.patch(
  "/update",
  isAuthenticated,
  body("id").notEmpty().isMongoId(),
  body("update").exists().isObject(),
  validator,
  PermissionGuard(PERMS.MANUFACTURER_UPDATE),
  RobustRunner(updateManufacturer)
);

router.delete(
  "/delete",
  isAuthenticated,
  body("id").notEmpty().isMongoId(),
  validator,
  PermissionGuard(PERMS.MANUFACTURER_DELETE),
  RobustRunner(removeManufacturer)
);

export default router;
