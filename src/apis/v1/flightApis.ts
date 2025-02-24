import express from "express";
import { body, query } from "express-validator";
import {
  createFlight,
  fetchAllFlightByMissionId,
  editFlight,
  deleteFlight,
  assignPilot,
  assignPilotSelf,
  fetchAllFlightdataByLocationId,
} from "../../controllers/v1/flightController";
import {
  isAuthenticated,
  canCreateMission,
  canUpdateMission,
  canDeleteMission,
  PermissionGuard,
} from "../../utils/authUtils";
import { validator, RobustRunner } from "../../utils/requestHelpers";
import { PERMS } from "../../schemas/permission";
const router = express.Router();

//++++++++++++++++++++ create new flight ++++++++++++++++++++++++

//the validation needs a recheck as well
router.post(
  "/create",
  isAuthenticated,
  canCreateMission,
  body("date").exists().isISO8601().toDate(),
  // REGEX
  body("time")
    .notEmpty()
    .matches(/(\d{2}:\d{2}) (AM|PM)/), // regex for format "hh:mm:ss AM/PM"
  body("name").notEmpty().isString().trim(),
  body("mission").notEmpty().isMongoId(),
  body("duration").notEmpty().isString().trim(),
  body("geoFence").optional().isObject(),
  validator,
  PermissionGuard(PERMS.FLIGHT_CREATE),
  RobustRunner(createFlight)
);

//++++++++++++++++++++ edit mission type Api++++++++++++++++++++++++
router.post(
  "/edit",
  isAuthenticated,
  canUpdateMission,
  body("_id").notEmpty().isMongoId(),
  body("name").notEmpty().isString().trim(),
  body("date")
    .exists()
    .isString()
    .notEmpty()
    .matches(/\d{4}-\d{2}-\d{2}/),
  body("duration").notEmpty().isString().trim(),
  body("time")
    .notEmpty()
    .matches(/(\d{2}:\d{2}) (AM|PM)/), // regex for format "hh:mm:ss AM/PM"
  body("locationId").notEmpty(), // .isMongoId(), // had to omit because frontend might send "none" as the value
  body("centerPoints").exists().isObject(),
  body("geoFence").optional().isObject(),
  body("geoLocation").optional().notEmpty().isString().trim(),
  validator,
  PermissionGuard(PERMS.FLIGHT_UPDATE),
  RobustRunner(editFlight)
);

//++++++++++++++++++++ delete mission type Api++++++++++++++++++++++++
router.post(
  "/delete",
  isAuthenticated,
  canDeleteMission,
  body("_id").notEmpty().isMongoId(),
  validator,
  PermissionGuard(PERMS.FLIGHT_DELETE),
  RobustRunner(deleteFlight)
);

//++++++++++++++++++++ fetch all mission for the specific user++++++++++++++++++++++++
router.post(
  "/mission-specific-view",
  isAuthenticated,
  body("missionID").notEmpty().isMongoId(),
  validator,
  PermissionGuard(PERMS.FLIGHT_LIST),
  RobustRunner(fetchAllFlightByMissionId)
);

router.get(
  "/get-flight-by-location-ID",
  isAuthenticated,
  query("id").notEmpty().isMongoId(),
  validator,
  PermissionGuard(PERMS.FLIGHT_LIST),
  RobustRunner(fetchAllFlightdataByLocationId)
);

//+++++++++++++++++++ assign pilot to flight ++++++++++++++++++++++++

router.patch(
  "/assign-pilot-self",
  isAuthenticated,
  body("flightID").notEmpty().isMongoId(),
  validator,
  PermissionGuard(PERMS.FLIGHT_UPDATE),
  RobustRunner(assignPilotSelf)
);

router.patch(
  "/assign-pilot",
  isAuthenticated,
  body("flightID").notEmpty().isMongoId(),
  body("pilotID").notEmpty().isMongoId(),
  validator,
  PermissionGuard(PERMS.MISSION_UPDATE, PERMS.FLIGHT_UPDATE),
  RobustRunner(assignPilot)
);

export default router;
