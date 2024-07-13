import express from "express";
// import { body } from "express-validator";
import {
  // createPermission,
  // fetchAllPermissions,
  // fetchTenantPermissions,
  fetchPermissions,
} from "../../controllers/v1/permissionController";
import { isAuthenticated, } from "../../utils/authUtils";
import { RobustRunner } from "../../utils/requestHelpers";

const router = express.Router();

//++++++++++++++++++++ create permission Api++++++++++++++++++++++++
// router.post(
//   "/create",
//   isAuthenticated,
//   onlySuperAdminAccess,
//   body("name").notEmpty().trim(),
//   validator,
//   RobustRunner(createPermission)
// );

//++++++++++++++++++++ fetch all Api++++++++++++++++++++++++
router.get(
  "/admin-permission-list",
  isAuthenticated,
  RobustRunner(fetchPermissions)
);

//++++++++++++++++++++ fetch tennat Api++++++++++++++++++++++++
router.get(
  "/tenant-permission-list",
  isAuthenticated,
  RobustRunner(fetchPermissions)
);

export default router;
