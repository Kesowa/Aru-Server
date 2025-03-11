import express from "express";
import { body, param, query } from "express-validator";

import {
  createMission,
  fetchAllMissionByUserId,
  editMission,
  deleteMission,
  fetchAllMissionsForTenant,
  fetchMissionById,
  missionStatusUpdate,
  fetchAllMissionByPilotOrNull,
  autoComplete,
  fetchTotalNumberofMissionByLocationID,
  fetchMissionsByLocationMapref,
  fetchMissionByLocationID,
  getDocumentCountForMission,
  insertMissionTypeById,
  // insertMissionTypeBytenantId,
  getMissionCsvForTenantOrUser,
  // convertClientIdToArray,
  getMissionLayerFiles,
  GetAlertLocationGeojson,
  GetVideoLocationGeojson,
} from "../../controllers/v1/missionController";
import { getMemoryUsage } from "../../controllers/v1/missionDataController";
import { PERMS } from "../../schemas/permission";
import { isAuthenticated, PermissionGuard } from "../../utils/authUtils";
import { isMissionCount } from "../../utils/countPermission";
import { validator, RobustRunner } from "../../utils/requestHelpers";

const router = express.Router();

//++++++++++++++++++++ create new mission ++++++++++++++++++++++++

//the validation needs a recheck as well
router.post(
  "/create",
  isAuthenticated,
  // isSuperAdmin,
  body("name").notEmpty().trim(),
  body("description").trim(), // no restriction for empty description present on frontend; user can initially provide no(empty) description and later edit and add a description
  // body("deliverables").isArray(),
  // body("assetId").optional().isMongoId(), // client sends "none" for assetId
  body("assetId").optional().isString(),
  // body("flights").exists({ checkFalsy: true }).isObject(),
  body("missionType").notEmpty().isMongoId(),
  body("clientId").optional().isArray(),
  validator,
  PermissionGuard(PERMS.MISSION_CREATE),
  isMissionCount,
  RobustRunner(createMission),
);

//++++++++++++++++++++ edit mission type Api++++++++++++++++++++++++
router.post(
  "/edit",
  isAuthenticated,
  body("name").optional().notEmpty().trim(),
  body("description").optional().notEmpty().trim(),
  body("deliverables").optional().isArray(),
  body("type").optional().isMongoId(),
  body("isPublic").optional().isBoolean(),
  validator,
  PermissionGuard(PERMS.MISSION_UPDATE),
  RobustRunner(editMission),
);

//++++++++++++++++++++ delete mission api++++++++++++++++++++++++
router.post(
  "/delete",
  isAuthenticated,
  body("_id").notEmpty().isMongoId(),
  validator,
  PermissionGuard(PERMS.MISSION_DELETE),
  RobustRunner(deleteMission),
);

//++++++++++++++++++++ fetch all mission for the specific user++++++++++++++++++++++++
router.post(
  "/mission-by-userid",
  isAuthenticated,
  PermissionGuard(PERMS.MISSION_LIST),
  RobustRunner(fetchAllMissionByUserId),
);

//++++++++++++++++++++ fetch all mission (Development purpose only) ++++++++++++++++++++++++
// router.get("/all-missions", isAuthenticated, fetchAllMissions);

//+++++++++++++++++++ fetch all mission for tenant +++++++++++++++++++++++++
router.get(
  "/get/tenant",
  isAuthenticated,
  query("filter").notEmpty().trim(), // mission status, like: Live, Completed, Review, etc., and "all" for all status
  query("missionType").optional().isMongoId(),
  query("client").optional().isBoolean(),
  // REGEX
  query("sort")
    .notEmpty()
    .trim()
    .matches(/(^[a-zA-Z]+):(ascend|descend)/), // ex: "createdAt:descend"
  query("page").exists().isNumeric().toInt(),
  query("limit").exists().isNumeric().toInt(),
  query("searchFilters").optional().isString(), // didn't quite understand the format
  validator,
  PermissionGuard(PERMS.MISSION_LIST),
  RobustRunner(fetchAllMissionsForTenant),
);

// Duplicate Route. Same logic for "/mission-by-userid", and "id" param not even used in controller
router.get(
  "/get/user/:id",
  isAuthenticated,
  param("id").notEmpty().isMongoId(),
  validator,
  PermissionGuard(PERMS.MISSION_LIST),
  RobustRunner(fetchAllMissionByUserId),
);

router.get(
  "/get/:id",
  isAuthenticated,
  param("id").notEmpty().isMongoId(),
  validator,
  PermissionGuard(PERMS.MISSION_LIST),
  RobustRunner(fetchMissionById),
);

//+++++++++++++++++++++ filter missions by status ++++++++++++++++++++++++

router.get(
  "/filtered-mission",
  isAuthenticated,
  query("status").isString().notEmpty().trim(),
  query("pilotID").optional().isMongoId(),
  //adding date format
  query("date").optional({ checkFalsy: true }).isString(),
  query("startDate").optional({ checkFalsy: true }).isISO8601(),
  query("endDate").optional({ checkFalsy: true }).isISO8601(),
  query("page").default(0).isNumeric().toInt(),
  validator,
  PermissionGuard(PERMS.MISSION_LIST),
  RobustRunner(fetchAllMissionByPilotOrNull),
);

router.patch(
  "/update-status",
  isAuthenticated,
  body("missionID").notEmpty().isMongoId(),
  body("status").notEmpty().trim(),
  validator,
  PermissionGuard(PERMS.MISSION_UPDATE),
  RobustRunner(missionStatusUpdate),
);

router.get(
  "/autocomplete",
  query("query").notEmpty().trim(),
  validator,
  RobustRunner(autoComplete),
);

router.get(
  "/get-total-number-of-mission-by-locationID",
  isAuthenticated,
  query("id").notEmpty().isMongoId(),
  PermissionGuard(PERMS.MISSION_LIST),
  RobustRunner(fetchTotalNumberofMissionByLocationID),
);

router.get(
  "/get-missions-by-location-mapref",
  isAuthenticated,
  query("id").notEmpty().isMongoId(),
  validator,
  PermissionGuard(PERMS.MISSION_LIST),
  RobustRunner(fetchMissionsByLocationMapref),
);

router.get(
  "/get-missions-by-locationID",
  isAuthenticated,
  query("missionID").notEmpty().isMongoId(),
  query("locationID").notEmpty().isMongoId(),
  validator,
  PermissionGuard(PERMS.MISSION_LIST),
  RobustRunner(fetchMissionByLocationID),
);
router.get(
  "/get-mission-csv-for-tenant-Or-user",
  isAuthenticated,
  body("userId").optional().notEmpty().isMongoId(),
  body("status").optional().trim(),
  validator,
  PermissionGuard(PERMS.MISSION_LIST),
  RobustRunner(getMissionCsvForTenantOrUser),
);
router.get(
  "/get-mission-doc-count",
  isAuthenticated,
  query("missionId").notEmpty().isMongoId(),
  validator,
  PermissionGuard(PERMS.MISSION_LIST),
  RobustRunner(getDocumentCountForMission),
);
router.post(
  "/insert-missiontype-by-Id",
  isAuthenticated,
  body("id").notEmpty().isMongoId(),
  body("missionType").notEmpty().isMongoId(),
  validator,
  PermissionGuard(PERMS.MISSION_TYPE_UPDATE, PERMS.MISSION_UPDATE),
  RobustRunner(insertMissionTypeById),
);

router.get(
  "/memory-usage/:id",
  isAuthenticated,
  param("id").notEmpty().isMongoId(),
  validator,
  PermissionGuard(PERMS.MISSION_LIST),
  RobustRunner(getMemoryUsage),
);

router.get(
  "/layerfiles/:id",
  isAuthenticated,
  param("id").notEmpty().isMongoId(),
  validator,
  PermissionGuard(PERMS.MISSION_LIST, PERMS.FEATURE_LIST),
  RobustRunner(getMissionLayerFiles),
);

router.get(
  "/:missionID/alerts",
  isAuthenticated,
  param("missionID").notEmpty().isMongoId(),
  query("startDate").notEmpty().isISO8601().toDate(),
  query("endDate").notEmpty().isISO8601().toDate(),
  validator,
  PermissionGuard(PERMS.MISSION_LIST, PERMS.ALERT_LIST),
  RobustRunner(GetAlertLocationGeojson),
);
router.get(
  "/:missionID/vods",
  isAuthenticated,
  param("missionID").notEmpty().isMongoId(),
  query("startDate").notEmpty().isISO8601().toDate(),
  query("endDate").notEmpty().isISO8601().toDate(),
  validator,
  PermissionGuard(PERMS.MISSION_LIST, PERMS.VOD_LIST),
  RobustRunner(GetVideoLocationGeojson),
);
export default router;
