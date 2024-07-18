import express from "express";
import {
  getLog,
  fetchLatestFlightlogDataByMissionId,
  fetchLatestFlightlogByLocationId,
  createFlightLog,
} from "../../controllers/v1/flightLogController";
import { isAuthenticated, canListFlightLogs } from "../../utils/authUtils";
import { query, body, oneOf } from "express-validator";
import { validator, RobustRunner } from "../../utils/requestHelpers";

const router = express.Router();

router.post(
  "/create",
  isAuthenticated,
  body("file").notEmpty().isMongoId(),
  body("date").exists().isISO8601().toDate(),
  // REGEX
  body("time")
    .notEmpty()
    .matches(/(\d{2}:\d{2}) (AM|PM)/), // regex for format "hh:mm:ss AM/PM"
  body("missionID").notEmpty().isMongoId(),
  body("flightID").notEmpty().isMongoId(),
  body("assetID").notEmpty().isMongoId(),
  body("locationID").optional().notEmpty().isMongoId(),
  body("duration").notEmpty().isString().trim(),
  body("location").notEmpty().isString().trim(),
  body("geofence").optional().isObject(),
  body("flightArea").isNumeric(),
  body("pilotName").notEmpty().isString().trim(),
  body("jobType").notEmpty().isString().trim(),
  body("deliverables").isArray(),
  RobustRunner(createFlightLog)
);

router.get(
  "/get",
  isAuthenticated,
  query("_id").optional().notEmpty().isMongoId(),
  validator,
  canListFlightLogs,
  RobustRunner(getLog)
);

router.get(
  "/last-flightlog-by-ID",
  isAuthenticated,
  oneOf([
    query("missionID").optional().notEmpty().isMongoId(),
    query("locationID").optional().notEmpty().isMongoId(),
  ]),
  validator,
  canListFlightLogs,
  RobustRunner(fetchLatestFlightlogDataByMissionId)
);

router.get(
  "/last-flightlog-by-location-ID",
  isAuthenticated,
  query("id").notEmpty().isMongoId(),
  validator,
  canListFlightLogs,
  RobustRunner(fetchLatestFlightlogByLocationId)
);
export default router;
