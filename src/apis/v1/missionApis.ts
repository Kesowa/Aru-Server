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
  insertMissionTypeBytenantId,
  getMissionCsvForTenantOrUser,
  convertClientIdToArray,
  getMissionLayerFiles,
  GetAlertLocationGeojson,
  GetVideoLocationGeojson,
} from "../../controllers/v1/missionController";
import {
  isAuthenticated,
  canFly,
  canCreateMission,
  canUpdateMission,
  canDeleteMission,
  canListMission,
  onlySuperAdminAccess,
} from "../../utils/authUtils";
import { isMissionCount } from "../../utils/countPermission";
import { getMemoryUsage } from "../../controllers/v1/missionDataController";
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
  canCreateMission,
  isMissionCount,
  RobustRunner(createMission)
);

//++++++++++++++++++++ edit mission type Api++++++++++++++++++++++++
router.post(
  "/edit",
  isAuthenticated,
  canUpdateMission,
  body("name").optional().notEmpty().trim(),
  body("description").optional().notEmpty().trim(),
  body("deliverables").optional().isArray(),
  body("type").optional().isMongoId(),
  validator,
  RobustRunner(editMission)
);

//++++++++++++++++++++ delete mission api++++++++++++++++++++++++
router.post(
  "/delete",
  isAuthenticated,
  body("_id").notEmpty().isMongoId(),
  validator,
  canDeleteMission,
  RobustRunner(deleteMission)
);

//++++++++++++++++++++ fetch all mission for the specific user++++++++++++++++++++++++
// TODO: Duplicate route of /get/user/:id, remove ?
router.post(
  "/mission-by-userid",
  isAuthenticated,
  canListMission,
  RobustRunner(fetchAllMissionByUserId)
);

//++++++++++++++++++++ fetch all mission (Development purpose only) ++++++++++++++++++++++++
// router.get("/all-missions", isAuthenticated, fetchAllMissions);

//+++++++++++++++++++ fetch all mission for tenant +++++++++++++++++++++++++
router.get(
  "/get/tenant",
  isAuthenticated,
  canListMission,
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
  query("searchFilters").optional().isString(), // TODO: didn't quite understand the format
  validator,
  RobustRunner(fetchAllMissionsForTenant)
);

// TODO: The :id parameter is not being used anywhere in the controller, change to /get/user ?
router.get(
  "/get/user/:id",
  isAuthenticated,
  param("id").notEmpty().isMongoId(),
  validator,
  canListMission,
  RobustRunner(fetchAllMissionByUserId)
);

router.get(
  "/get/:id",
  isAuthenticated,
  param("id").notEmpty().isMongoId(),
  validator,
  canListMission,
  RobustRunner(fetchMissionById)
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
  canFly,
  RobustRunner(fetchAllMissionByPilotOrNull)
);

router.patch(
  "/update-status",
  isAuthenticated,
  body("missionID").notEmpty().isMongoId(),
  body("status").notEmpty().trim(),
  validator,
  RobustRunner(missionStatusUpdate)
);

router.get(
  "/autocomplete",
  query("query").notEmpty().trim(),
  validator,
  RobustRunner(autoComplete)
);

router.get(
  "/get-total-number-of-mission-by-locationID",
  isAuthenticated,
  query("id").notEmpty().isMongoId(),
  canListMission,
  RobustRunner(fetchTotalNumberofMissionByLocationID)
);

router.get(
  "/get-missions-by-location-mapref",
  isAuthenticated,
  query("id").notEmpty().isMongoId(),
  validator,
  canListMission,
  RobustRunner(fetchMissionsByLocationMapref)
);

router.get(
  "/get-missions-by-locationID",
  isAuthenticated,
  query("missionID").notEmpty().isMongoId(),
  query("locationID").notEmpty().isMongoId(),
  validator,
  canListMission,
  RobustRunner(fetchMissionByLocationID)
);
router.get(
  "/get-mission-csv-for-tenant-Or-user",
  isAuthenticated,
  body("userId").optional().notEmpty().isMongoId(),
  body("status").optional().trim(),
  validator,
  RobustRunner(getMissionCsvForTenantOrUser)
);
router.get(
  "/get-mission-doc-count",
  isAuthenticated,
  query("missionId").notEmpty().isMongoId(),
  validator,
  RobustRunner(getDocumentCountForMission)
);
router.post(
  "/insert-missiontype-by-Id",
  isAuthenticated,
  body("id").notEmpty().isMongoId(),
  body("missionType").notEmpty().isMongoId(),
  validator,
  RobustRunner(insertMissionTypeById)
);
router.post(
  "/insert-missionType-for-tenantId",
  isAuthenticated,
  body("missionType").notEmpty().isMongoId(),
  validator,
  RobustRunner(insertMissionTypeBytenantId)
);

router.patch(
  "/convert-clientId-to-array",
  isAuthenticated,
  onlySuperAdminAccess,
  RobustRunner(convertClientIdToArray)
);
router.get(
  "/memory-usage/:id",
  isAuthenticated,
  param("id").notEmpty().isMongoId(),
  validator,
  RobustRunner(getMemoryUsage)
);

router.get(
  "/layerfiles/:id",
  isAuthenticated,
  param("id").notEmpty().isMongoId(),
  validator,
  RobustRunner(getMissionLayerFiles)
);

router.get(
  "/:missionID/alerts",
  isAuthenticated,
  param("missionID").notEmpty().isMongoId(),
  query("startDate").notEmpty().isISO8601().toDate(),
  query("endDate").notEmpty().isISO8601().toDate(),
  validator,
  RobustRunner(GetAlertLocationGeojson)
);
router.get(
  "/:missionID/vods",
  isAuthenticated,
  param("missionID").notEmpty().isMongoId(),
  query("startDate").notEmpty().isISO8601().toDate(),
  query("endDate").notEmpty().isISO8601().toDate(),
  validator,
  RobustRunner(GetVideoLocationGeojson)
);
export default router;
