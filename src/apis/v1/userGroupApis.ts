import express from "express";
import { body, query } from "express-validator";

import {
  createUserGroupforTenant,
  listUserGroupforTenant,
  UserGroupDelete,
  UserGroupforEdit,
  getUserGroupbyID,
} from "../../controllers/v1/userGroupController";
import { PERMS } from "../../schemas/permission";
import { isAuthenticated, PermissionGuard } from "../../utils/authUtils";
import { isUserGroupCount } from "../../utils/countPermission";
import { validator, RobustRunner } from "../../utils/requestHelpers";
const router = express.Router();

//++++++++++++++++++++ Tenant creation Api +++++++++++++++++++++++++++++
router.post(
  "/tenant-usergroup-create",
  isAuthenticated,
  body("name").notEmpty().trim(),
  body("permissions")
    .notEmpty()
    .isArray({ min: 1 })
    .withMessage("Invalid permissions array"),
  validator,
  PermissionGuard(PERMS.USER_GROUP_CREATE),
  isUserGroupCount,
  RobustRunner(createUserGroupforTenant),
);

//list user groups
router.get(
  "/tenant-usergroup-list",
  isAuthenticated,
  query("sort").optional(), // String of format "<field>:<asce or desc>", like "name:desc"
  validator,
  PermissionGuard(PERMS.USER_GROUP_LIST),
  RobustRunner(listUserGroupforTenant),
);

//get user group by ID
router.get(
  "/tenant-usergroup-by-id",
  isAuthenticated,
  query("id").notEmpty().isMongoId(),
  validator,
  PermissionGuard(PERMS.USER_GROUP_LIST),
  RobustRunner(getUserGroupbyID),
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
  PermissionGuard(PERMS.USER_GROUP_UPDATE),
  RobustRunner(UserGroupforEdit),
);

router.delete(
  "/tenant-usergroup-delete",
  isAuthenticated,
  query("id").notEmpty().isMongoId(),
  validator,
  PermissionGuard(PERMS.USER_GROUP_DELETE),
  RobustRunner(UserGroupDelete),
);

export default router;
