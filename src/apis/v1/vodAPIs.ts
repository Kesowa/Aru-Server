import express from "express";
import { body, oneOf, query } from "express-validator";

import {
  getByFlightOrLocationID,
  getByMissionID,
  saveVOD,
  fetchAllVoddataByLocationId,
  saveVODManual,
  removeVOD,
  // testApiinjectTenantID,
  renameVOD,
  updateVOD,
  updateMultiVOD,
  removeMultiVOD,
  getCountByMissionID,
  getVODByID,
} from "../../controllers/v1/VODcontroller";
import { PERMS } from "../../schemas/permission";
import { isAuthenticated, PermissionGuard } from "../../utils/authUtils";
import { isVodCount } from "../../utils/countPermission";
import { RobustRunner, validator } from "../../utils/requestHelpers";

const router = express.Router();

router.post(
  "/save-VOD",
  body("filename").exists().isString().notEmpty(),
  validator,
  RobustRunner(saveVOD),
);

router.post(
  "/save-vod-manual",
  isAuthenticated,
  body("file").notEmpty().isMongoId(),
  body("locationID").default("5f202f03b9225726102721b8").notEmpty().isMongoId(),
  body("missionID").notEmpty().isMongoId(),
  body("flightID").notEmpty().isMongoId(),
  validator,
  PermissionGuard(PERMS.VOD_CREATE),
  isVodCount,
  RobustRunner(saveVODManual),
);

//  update data
// router.patch(
//   "/test-vod-inject",
//   isAuthenticated,
//   body("limit").exists({ checkFalsy: true }).isNumeric().toInt(),
//   body("locationId").notEmpty().isMongoId(),
//   body("missionId").notEmpty().isMongoId(),
//   body("flightId").notEmpty().isMongoId(),
//   validator,
//   RobustRunner(testApiinject)
// );

router.post(
  "/get-by-ID",
  isAuthenticated,
  body("Id").notEmpty().isArray({ min: 1 }),
  validator,
  PermissionGuard(PERMS.VOD_LIST),
  RobustRunner(getVODByID),
);

// all get method here
router.get(
  "/get-by-missionID",
  isAuthenticated,
  query("missionID").notEmpty().isMongoId(),
  query("page").default(0).isInt().toInt(),
  // REGEX
  query("sort")
    .optional()
    .isString()
    .notEmpty()
    .trim()
    .matches(/^[a-zA-Z]{1,20}:[a-zA-Z]{1,5}$/), // ex: "createdAt:desc"
  query("limit").default(200).isInt({ min: 1, max: 500 }).toInt(),
  query("isFlagged").optional().isBoolean().toBoolean(),
  validator,
  PermissionGuard(PERMS.VOD_LIST),
  RobustRunner(getByMissionID),
);

router.get(
  "/get-count-by-missionID",
  isAuthenticated,
  query("missionID").notEmpty().isMongoId(),
  validator,
  PermissionGuard(PERMS.VOD_LIST),
  RobustRunner(getCountByMissionID),
);

router.get(
  "/get-by-flightID",
  isAuthenticated,
  oneOf([
    [
      query("flightID").notEmpty().isMongoId(),
      query("page").notEmpty().isNumeric().toInt(),
    ],
    query("locationID").notEmpty().isMongoId(),
  ]),
  validator,
  PermissionGuard(PERMS.VOD_LIST),
  RobustRunner(getByFlightOrLocationID),
);

router.get(
  "/get-by-location-ID",
  isAuthenticated,
  query("limit").default(10).isInt({ min: 1, max: 50 }).toInt(),
  query("page").default(1).isInt({ min: 1 }).toInt(),
  query("id").notEmpty().isMongoId(),
  validator,
  PermissionGuard(PERMS.VOD_LIST),
  RobustRunner(fetchAllVoddataByLocationId),
);

router.delete(
  "/delete-by-ID",
  isAuthenticated,
  body("Id").notEmpty().isMongoId(),
  validator,
  PermissionGuard(PERMS.VOD_DELETE),
  RobustRunner(removeVOD),
);

router.delete(
  "/delete-multi-by-ID",
  isAuthenticated,
  body("Id").notEmpty().isArray({ min: 1 }),
  validator,
  PermissionGuard(PERMS.VOD_DELETE, PERMS.VOD_LIST),
  RobustRunner(removeMultiVOD),
);

router.patch(
  "/edit-by-ID",
  isAuthenticated,
  body("id").notEmpty().isMongoId(),
  body("update").notEmpty().isObject(),
  validator,
  PermissionGuard(PERMS.VOD_UPDATE),
  RobustRunner(renameVOD),
);

router.patch(
  "/update-vod-by-ID",
  isAuthenticated,
  body("id").notEmpty().isMongoId(),
  body("update").notEmpty().isObject(),
  validator,
  PermissionGuard(PERMS.VOD_UPDATE),
  RobustRunner(updateVOD),
);
router.patch(
  "/update-multi-vod-by-ID",
  isAuthenticated,
  body("Id").notEmpty().isArray({ min: 1 }),
  body("update").notEmpty().isObject(),
  validator,
  PermissionGuard(PERMS.VOD_LIST, PERMS.VOD_UPDATE),
  RobustRunner(updateMultiVOD),
);

export default router;
