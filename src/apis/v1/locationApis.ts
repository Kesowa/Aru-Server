import express from "express";
import {
  isAuthenticated,
  canCreateLocation,
  canUpdateLocation,
  canDeleteLocation,
  canListLocation,
} from "../../utils/authUtils";
import {
  createLocation,
  deleteLocation,
  getLocation,
  getLocationByID,
  getwithinLocationByID,
  getLocationByLatLong,
  updateLocation,
} from "../../controllers/v1/locationController";
import { isLocationCount } from "../../utils/countPermission";
import { body, oneOf, query } from "express-validator";
import { validator, RobustRunner } from "../../utils/requestHelpers";

const router = express.Router();

router.post(
  "/create",
  isAuthenticated,
  body("type").notEmpty().trim(),
  body("coordinates").notEmpty().isObject(),
  body("properties").notEmpty().isObject(),

  canCreateLocation,
  isLocationCount,
  RobustRunner(createLocation)
);

router.get("/get", isAuthenticated, canListLocation, RobustRunner(getLocation));

// Route not used in client, and inconsistent
router.get(
  "/get-within-by-id",
  isAuthenticated,
  query("id").notEmpty().isMongoId(),
  validator,
  canListLocation,
  RobustRunner(getwithinLocationByID)
);

router.get(
  "/get-by-id",
  isAuthenticated,
  query("id").notEmpty().isMongoId(),
  validator,
  canListLocation,
  RobustRunner(getLocationByID)
);

router.patch(
  "/update",
  isAuthenticated,
  body("id").notEmpty().isMongoId(),
  body("type").notEmpty().trim(),
  body("properties").notEmpty().isObject(),
  validator,
  canUpdateLocation,
  RobustRunner(updateLocation)
);

router.get(
  "/get-locationID-By-lat-long",
  isAuthenticated,
  query("lat").exists().isNumeric().toInt(),
  query("long").exists().isNumeric().toInt(),
  validator,
  RobustRunner(getLocationByLatLong)
);

router.delete(
  "/delete",
  isAuthenticated,
  query("id").notEmpty().isMongoId(),
  validator,
  canDeleteLocation,
  RobustRunner(deleteLocation)
);

export default router;
