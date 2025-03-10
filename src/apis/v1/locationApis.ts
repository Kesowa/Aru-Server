import express from "express";
import { body, query } from "express-validator";

import {
  createLocation,
  deleteLocation,
  getLocation,
  getLocationByID,
  getwithinLocationByID,
  getLocationByLatLong,
  updateLocation,
} from "../../controllers/v1/locationController";
import { PERMS } from "../../schemas/permission";
import { isAuthenticated, PermissionGuard } from "../../utils/authUtils";
import { isLocationCount } from "../../utils/countPermission";
import { validator, RobustRunner } from "../../utils/requestHelpers";

const router = express.Router();

router.post(
  "/create",
  isAuthenticated,
  body("type").notEmpty().trim(),
  body("coordinates").notEmpty().isObject(),
  body("properties").notEmpty().isObject(),
  PermissionGuard(PERMS.LOCATION_CREATE),
  isLocationCount,
  RobustRunner(createLocation)
);

router.get(
  "/get",
  isAuthenticated,
  PermissionGuard(PERMS.LOCATION_LIST),
  RobustRunner(getLocation)
);

// Route not used in client, and inconsistent
router.get(
  "/get-within-by-id",
  isAuthenticated,
  query("id").notEmpty().isMongoId(),
  validator,
  PermissionGuard(PERMS.LOCATION_LIST),
  RobustRunner(getwithinLocationByID)
);

router.get(
  "/get-by-id",
  isAuthenticated,
  query("id").notEmpty().isMongoId(),
  validator,
  PermissionGuard(PERMS.LOCATION_LIST),
  RobustRunner(getLocationByID)
);

router.patch(
  "/update",
  isAuthenticated,
  body("id").notEmpty().isMongoId(),
  body("properties").notEmpty().isObject(),
  body("geometry").notEmpty().isObject(),
  body("geometry.coordinates").notEmpty().isArray(),
  body("geometry.type").notEmpty().isString(),
  validator,
  PermissionGuard(PERMS.LOCATION_UPDATE),
  RobustRunner(updateLocation)
);

router.get(
  "/get-locationID-By-lat-long",
  isAuthenticated,
  query("lat").exists().isNumeric().toInt(),
  query("long").exists().isNumeric().toInt(),
  validator,
  PermissionGuard(PERMS.LOCATION_LIST),
  RobustRunner(getLocationByLatLong)
);

router.delete(
  "/delete",
  isAuthenticated,
  query("id").notEmpty().isMongoId(),
  validator,
  PermissionGuard(PERMS.LOCATION_DELETE),
  RobustRunner(deleteLocation)
);

export default router;
