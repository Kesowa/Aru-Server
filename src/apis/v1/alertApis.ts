import express from "express";
import { body, check, oneOf, query } from "express-validator";

import {
  createAlert,
  fetchAllAlertByFlightorLocationId,
  fetchAllAlertByAlertId,
  fetchNumberofAlertsByLocationId,
  fetchAlertsUsePaginationByMissionID,
  fetchAllAlertsByMissionMapref,
  testApiinject,
  fetchAllAlertByLocationIdAndTime,
  fetchAllAlertByLocationId,
  convertImageToThumbnail,
  fetchAlertsUsePaginationByLocationId,
  fetchAllAlertByTenantId,
  deleteMultipleAlerts,
  advancedAlertResultByTenantId,
  manualUploadAlert,
  updateAlert,
  updateMultiAlert,
} from "../../controllers/v1/alertController";

import { canCreateAlert, isAuthenticated } from "../../utils/authUtils";
import { isAlertCount } from "../../utils/countPermission";
import { isSize } from "../../utils/sizePermission";
import { validator, RobustRunner } from "../../utils/requestHelpers";
import multer from "multer";
import { multerStorage } from "../../utils/fileUploadUtils";
import { Directory } from "../../constants";
import { uploadFile } from "../../controllers/v1/commonController";
const router = express.Router();

const upload = multer({ storage: multerStorage(Directory.ALERT_IMAGES, true)});
//++++++++++++++++++++ package poster upload Api++++++++++++++++++++++++
router.post(
  "/upload-alert-image",
  isAuthenticated,
  canCreateAlert,
  upload.single("image"),
  isSize,
  RobustRunner(uploadFile)
);

//++++++++++++++++++++ create alert++++++++++++++++++++++++++++++++++
router.post(
  "/create",
  isAuthenticated,

  body("missionId").notEmpty().isMongoId(),
  body("flightId").notEmpty().isMongoId(),
  body("locationName").notEmpty().isString(),
  body("locationId").optional({ nullable: true, checkFalsy: true }).isMongoId(),
  body("location.lat").optional().isNumeric(),
  body("location.long").optional().isNumeric(),
  body("note").optional().notEmpty().isString(),
  body("onSite").optional().exists().isBoolean(),
  body("image").notEmpty().isString(),
  body("pcount").notEmpty().isNumeric(),
  body("type").notEmpty().isString(),
  validator,
  canCreateAlert,
  isAlertCount,
  RobustRunner(createAlert)
);
router.post(
  "/manual-upload-alert",
  isAuthenticated,
  upload.single("image"),
  body("missionId").notEmpty().isMongoId(),
  body("flightId").notEmpty().isMongoId(),
  body("locationName").notEmpty().isString(),
  body("locationId").optional().isMongoId(),
  // body("location").optional().exists().customSanitizer(val => JSON.parse(val)).custom(val => (val.lat && val.lng)),
  body("note").optional().notEmpty().isString(),
  body("onSite").optional().exists().isBoolean(),
  body("pcount").notEmpty().isNumeric(),
  body("type").notEmpty().isString(),
  validator,
  canCreateAlert,
  isSize,
  RobustRunner(manualUploadAlert)
);
//+++++++++++++++++++ fetch all alert for a mission +++++++++++++++++++++++++

router.get(
  "/get-alerts-by-flight-or-location-ID",
  isAuthenticated,
  oneOf([
    check("flightID").notEmpty().isMongoId(),
    check("locationID").notEmpty().isMongoId(),
  ]),
  validator,
  RobustRunner(fetchAllAlertByFlightorLocationId)
);
router.get(
  "/get-alert-by-ID",
  isAuthenticated,
  query("id").notEmpty().isMongoId(),
  validator,
  RobustRunner(fetchAllAlertByAlertId)
);
router.get(
  "/get-alerts-by-location-ID",
  isAuthenticated,
  query("id").notEmpty().isMongoId(),
  validator,
  RobustRunner(fetchAllAlertByLocationId)
);

router.get(
  "/get-alert-by-location-ID-and-time",
  isAuthenticated,
  query("locationID").notEmpty().isMongoId(),
  query("time").notEmpty().isString(),
  validator,
  RobustRunner(fetchAllAlertByLocationIdAndTime)
);

router.get(
  "/get-number-of-alerts-By-location-ID",
  isAuthenticated,
  query("id").notEmpty().isMongoId(),
  validator,
  RobustRunner(fetchNumberofAlertsByLocationId)
);

router.get(
  "/get-alerts-By-mission-ID",
  isAuthenticated,
  query("page").exists().isNumeric().toInt(),
  query("limit").exists().isNumeric().toInt(),
  // REGEX
  query("sortBy")
    .optional()
    .matches(
      /(createdAt|updatedAt|location|locationName|pcount|fileSize|type):(desc|asce)/
    ),
  query("alertType").optional().isString(),
  query("id").notEmpty().isMongoId(),
  query("isFlagged").optional().isBoolean().toBoolean(),
  validator,
  RobustRunner(fetchAlertsUsePaginationByMissionID)
);

router.get(
  "/get-alerts-By-location-id-pagination",
  isAuthenticated,
  query("page").exists().isNumeric().toInt(),
  query("limit").exists().isNumeric().toInt(),
  query("id").notEmpty().isMongoId(),
  // REGEX
  query("sortBy")
    .optional()
    .matches(
      /(createdAt|updatedAt|location|locationName|pcount|fileSize|type):(desc|asc)/
    ),
  validator,
  RobustRunner(fetchAlertsUsePaginationByLocationId)
);

router.get(
  "/get-alerts-by-mission-mapref",
  isAuthenticated,
  query("id").notEmpty().isMongoId(),
  validator,
  RobustRunner(fetchAllAlertsByMissionMapref)
);
router.patch(
  "/test-alert-inject",
  isAuthenticated,
  body("tenantId").notEmpty().isMongoId(),
  validator,
  RobustRunner(testApiinject)
);
router.get(
  "/get-alerts-by-tenantid",
  isAuthenticated,
  // REGEX
  query("time")
    .optional()
    .matches(/[0-9]+\s[a-zA-Z]+/), // ex: "2 days"
  validator,
  RobustRunner(fetchAllAlertByTenantId)
);
router.get(
  "/get-alerts-by-tenantid-advanced-result",
  isAuthenticated,
  // REGEX
  query("timeRange")
    .optional()
    .matches(/\d{4}-\d{2}-\d{2}\s\d{4}-\d{2}-\d{2}/), // ex: "2022-09-26 2022-09-27"
  // REGEX
  query("time")
    .optional()
    .matches(/[0-9]+\s[a-zA-Z]+/), // ex: "2 days"
  query("user").optional().isString(),
  query("page").isNumeric().toInt(),
  query("limit").isNumeric().toInt(),
  validator,
  RobustRunner(advancedAlertResultByTenantId)
);
router.get(
  "/convert-all-image-to-thumbnail",
  isAuthenticated,
  RobustRunner(convertImageToThumbnail)
);
router.delete(
  "/delete-multiple-alerts",
  isAuthenticated,
  body("id").notEmpty().isArray({ min: 1 }),
  validator,
  RobustRunner(deleteMultipleAlerts)
);

router.patch(
  "/update-alert-by-ID",
  isAuthenticated,
  body("id").notEmpty().isMongoId(),
  body("update").notEmpty().isObject(),
  validator,
  RobustRunner(updateAlert)
);
router.patch(
  "/update-multi-alert-by-ID",
  isAuthenticated,
  body("Id").notEmpty().isArray({ min: 1 }),
  body("update").notEmpty().isObject(),
  validator,
  RobustRunner(updateMultiAlert)
);
// only for development purpose delete during moving to production
// router.post('/update-ids', updateAlertIds);
export default router;
