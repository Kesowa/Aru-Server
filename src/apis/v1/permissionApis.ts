import express from "express";
import { body } from "express-validator";
import {
  createPermission,
  fetchAllPermissions,
  fetchTenantPermissions,
} from "../../controllers/v1/permissionController";
import {
  isAuthenticated,
  onlySuperAdminAccess,
  onlyTenantRootAccess,
} from "../../utils/authUtils";
import { validator, RobustRunner } from "../../utils/requestHelpers";

const router = express.Router();

//++++++++++++++++++++ create permission Api++++++++++++++++++++++++
router.post(
  "/create",
  isAuthenticated,
  onlySuperAdminAccess,
  body("name").notEmpty().trim(),
  validator,
  RobustRunner(createPermission)
);

//++++++++++++++++++++ fetch all Api++++++++++++++++++++++++
router.get(
  "/admin-permission-list",
  isAuthenticated,
  onlySuperAdminAccess,
  RobustRunner(fetchAllPermissions)
);

//++++++++++++++++++++ fetch tennat Api++++++++++++++++++++++++
router.get(
  "/tenant-permission-list",
  isAuthenticated,
  onlyTenantRootAccess,
  RobustRunner(fetchTenantPermissions)
);

export default router;
