import express from "express";
import { body, param, query, oneOf } from "express-validator";

import {
  createClientformissionGroup,
  getMissionById,
  insertClientforMission,
  editClientDetails,
  deleteCientforTenant,
  getListClient,
  removeClientfromMission,
  clientCsv,
  getClientByEmail,
  reactivateClient,
  getClientById,
} from "../../controllers/v1/clientController";
import {
  inviteClient,
  registerClient,
} from "../../controllers/v1/clientInviteController";
import { fetchMissionById } from "../../controllers/v1/missionController";
import { PERMS } from "../../schemas/permission";
import { isAuthenticated, PermissionGuard } from "../../utils/authUtils";
import { isClientCount } from "../../utils/countPermission";
import { validator, RobustRunner } from "../../utils/requestHelpers";
const router = express.Router();

router.post(
  "/create",
  isAuthenticated,
  body("name").notEmpty().trim(),
  body("email").isEmail().withMessage("invalid Email."),
  body("phoneNo").isString().notEmpty().trim(),
  body("userGroupId").notEmpty(),
  body("userType").notEmpty().trim(),
  body("country").optional().notEmpty().trim(),
  body("city").optional().notEmpty().trim(),
  //adding date format
  body("expiryDate").exists().isISO8601().toDate(),
  body("avatar").optional({ checkFalsy: true }).isMongoId(),
  validator,
  PermissionGuard(PERMS.CREATE_CLIENT),
  isClientCount,
  RobustRunner(createClientformissionGroup),
);
router.get(
  "/get-mission-list-for-Id",
  isAuthenticated,
  query("page").default(0).isNumeric().toInt(),
  query("limit").default(10).isNumeric().toInt(),
  query("status")
    .notEmpty()
    .trim()
    .matches(/(Upcoming|Completed|All)/), // Upcoming or Completed or All
  query("clientId").notEmpty(),
  query("createdAt").optional().notEmpty().isString(), // asce or desc, sorting order, optional
  validator,
  PermissionGuard(PERMS.MISSION_LIST),
  RobustRunner(getMissionById),
);
router.patch(
  "/edit-client-details",
  isAuthenticated,
  // This endpoint is being used for 2 seperate purposes: (i) To change only password (ii) To change other details;
  oneOf([
    [
      body("id").notEmpty(),
      body("name").notEmpty().trim(),
      body("email").isEmail().withMessage("invalid Email."),
      body("phoneNo").isString().notEmpty().trim(),
      body("userGroupId").notEmpty(),
      body("avatar").optional().notEmpty().trim(),
      //adding date format
      body("expiryDate").optional().isISO8601().toDate(),
    ],
    [body("id").notEmpty(), body("password").isLength({ min: 6 })],
  ]),
  validator,
  PermissionGuard(PERMS.EDIT_CLIENT),
  RobustRunner(editClientDetails),
);
router.get(
  "/get-list-client",
  isAuthenticated,
  query("page").default(1).isInt({ min: 1 }).toInt(),
  query("limit").default(10).isInt({ max: 100 }).toInt(),
  query("sort").optional(), // String of format "<field>:<asce or desc>", like "name:desc"
  validator,
  PermissionGuard(PERMS.CLIENT_LIST),
  RobustRunner(getListClient),
);
router.delete(
  "/delete-client",
  isAuthenticated,
  body("id").notEmpty(),
  validator,
  PermissionGuard(PERMS.DELETE_CLIENT),
  RobustRunner(deleteCientforTenant),
);
router.get(
  "/reactivate-client/:token",
  param("token").notEmpty().isString().trim(),
  validator,
  RobustRunner(reactivateClient),
);
router.patch(
  "/insert-client-for-mission",
  isAuthenticated,
  body("missionId").notEmpty(),
  body("clientId").isArray({ min: 1 }),
  validator,
  PermissionGuard(PERMS.MISSION_UPDATE, PERMS.EDIT_CLIENT, PERMS.CREATE_CLIENT),
  RobustRunner(insertClientforMission),
);
router.patch(
  "/remove-client-from-mission",
  isAuthenticated,
  query("id").notEmpty(),
  query("clientId").notEmpty(),
  validator,
  PermissionGuard(PERMS.MISSION_UPDATE, PERMS.EDIT_CLIENT, PERMS.CREATE_CLIENT),
  RobustRunner(removeClientfromMission),
);
router.get(
  "/geneate-client-csv",
  isAuthenticated,
  PermissionGuard(PERMS.CLIENT_LIST),
  RobustRunner(clientCsv),
);

router.get(
  "/get-client-mission-details/:id",
  isAuthenticated,
  param("id").notEmpty(),
  validator,
  PermissionGuard(PERMS.MISSION_LIST),
  RobustRunner(fetchMissionById),
);

router.get(
  "/get-client-by-email",
  isAuthenticated,
  query("email").isEmail().withMessage("invalid Email."),
  validator,
  PermissionGuard(PERMS.CLIENT_LIST),
  RobustRunner(getClientByEmail),
);

router.get(
  "/get-client-by-id",
  isAuthenticated,
  query("id").isMongoId().withMessage("invalid id"),
  validator,
  PermissionGuard(PERMS.CLIENT_LIST),
  RobustRunner(getClientById),
);

router.post(
  "/invite-client-to-mission",
  isAuthenticated,
  body("missionID").notEmpty(),
  body("emailID").isEmail().withMessage("invalid Email."),
  validator,
  PermissionGuard(PERMS.MISSION_UPDATE, PERMS.EDIT_CLIENT, PERMS.CREATE_CLIENT),
  RobustRunner(inviteClient),
);

router.get(
  "/register/:token",
  param("token").notEmpty(),
  validator,
  RobustRunner(registerClient),
);

export default router;
