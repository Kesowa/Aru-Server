import express from "express";

import {
  fetchPermissions,
} from "../../controllers/v1/permissionController";
import { isAuthenticated } from "../../utils/authUtils";
import { RobustRunner } from "../../utils/requestHelpers";

const router = express.Router();

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
