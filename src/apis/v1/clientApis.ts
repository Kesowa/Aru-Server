import express from "express";
import {
  createClientformissionGroup,
  getMissionById,
  insertClientforMission,
  editClientDetails,
  deleteCientforTenant,
  getListClient,
  removeClientfromMission,
  clientCsv,
  devApiClientArr,
  getClientByEmail,
  reactivateClient,
} from "../../controllers/v1/clientController";
import { fetchMissionById } from "../../controllers/v1/missionController";
import {
  isAuthenticated,
  canClient,
  canEditClient,
  canDeleteClient,
  canCreateClient,
  canManageClient,
  canListMission,
} from "../../utils/authUtils";

import { isClientCount } from "../../utils/countPermission";
import {
  inviteClient,
  registerClient,
} from "../../controllers/v1/clientInviteController";
import { body, param, query, oneOf } from "express-validator";
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
  body("avatar").optional().isString().trim(),
  validator,
  canCreateClient,
  isClientCount,
  RobustRunner(createClientformissionGroup)
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
  canClient,
  RobustRunner(getMissionById)
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
  canEditClient,
  RobustRunner(editClientDetails)
);
router.get(
  "/get-list-client",
  isAuthenticated,
  query("page").default(1).isInt({ min: 1 }).toInt(),
  query("limit").default(10).isInt({ max: 100 }).toInt(),
  query("sort").optional(), // String of format "<field>:<asce or desc>", like "name:desc"
  validator,
  canListMission,
  RobustRunner(getListClient)
);
router.delete(
  "/delete-client",
  isAuthenticated,
  body("id").notEmpty(),
  validator,
  canDeleteClient,
  RobustRunner(deleteCientforTenant)
);
router.get(
  "/reactivate-client/:token",
  param("token").notEmpty().isString().trim(),
  validator,
  RobustRunner(reactivateClient)
);
router.patch(
  "/insert-client-for-mission",
  isAuthenticated,
  body("missionId").notEmpty(),
  body("clientId").isArray({ min: 1 }),
  validator,
  canManageClient,
  RobustRunner(insertClientforMission)
);
router.patch(
  "/remove-client-from-mission",
  isAuthenticated,
  query("id").notEmpty(),
  query("clientId").notEmpty(),
  validator,
  canManageClient,
  RobustRunner(removeClientfromMission)
);
router.get(
  "/geneate-client-csv",
  isAuthenticated,
  canManageClient,
  RobustRunner(clientCsv)
);

router.patch(
  "/patch-api-clientarr",
  body("tenantId").notEmpty(),
  validator,
  RobustRunner(devApiClientArr)
);

router.get(
  "/get-client-mission-details/:id",
  isAuthenticated,
  param("id").notEmpty(),
  validator,
  canClient,
  RobustRunner(fetchMissionById)
);

router.get(
  "/get-client-by-email",
  isAuthenticated,
  query("email").isEmail().withMessage("invalid Email."),
  validator,
  canClient,
  RobustRunner(getClientByEmail)
);

router.post(
  "/invite-client-to-mission",
  isAuthenticated,
  body("missionID").notEmpty(),
  body("emailID").isEmail().withMessage("invalid Email."),
  validator,
  canManageClient,
  RobustRunner(inviteClient)
);

router.get(
  "/register/:token",
  param("token").notEmpty(),
  validator,
  RobustRunner(registerClient)
);

export default router;
