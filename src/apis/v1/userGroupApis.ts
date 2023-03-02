import express from "express";
import { body, param, query } from "express-validator";
import {
  createUserGroupforTenant,
  listUserGroupforTenant,
  UserGroupDelete,
  UserGroupforEdit,
  getUserGroupbyID,
} from "../../controllers/v1/userGroupController";
import {
  isAuthenticated,
  onlyTenantRootAccess,
  canListUserGroup,
} from "../../utils/authUtils";
import { isUserGroupCount } from "../../utils/countPermission";
import { validator, RobustRunner } from "../../utils/requestHelpers";
const router = express.Router();

//++++++++++++++++++++ Tenant creation Api +++++++++++++++++++++++++++++
router.post(
  "/tenant-usergroup-create",
  isAuthenticated,
  onlyTenantRootAccess,
  body("name").notEmpty().trim(),
  body("permissions")
    .notEmpty()
    .isArray({ min: 1 })
    .withMessage("Invalid permissions array"),
  validator,
  isUserGroupCount,
  RobustRunner(createUserGroupforTenant)
);

//list user groups
router.get(
  "/tenant-usergroup-list",
  isAuthenticated,
  query("sort").optional(), // String of format "<field>:<asce or desc>", like "name:desc"
  validator,
  canListUserGroup,
  RobustRunner(listUserGroupforTenant)
);

//get user group by ID
router.get(
  "/tenant-usergroup-by-id",
  isAuthenticated,
  query("id").notEmpty().isMongoId(),
  validator,
  canListUserGroup,
  RobustRunner(getUserGroupbyID)
);

router.patch(
  "/tenant-usergroup-edit",
  isAuthenticated,
  body("id").notEmpty().isMongoId(),
  body("name").optional().notEmpty().trim(),
  body("permissions")
    .optional()
    .notEmpty()
    .isArray({ min: 1 })
    .withMessage("Invalid permissions array"),
  validator,
  onlyTenantRootAccess,
  RobustRunner(UserGroupforEdit)
);

router.delete(
  "/tenant-usergroup-delete",
  isAuthenticated,
  query("id").notEmpty().isMongoId(),
  validator,
  onlyTenantRootAccess,
  RobustRunner(UserGroupDelete)
);

export default router;
