import express from "express";
import { body, query } from "express-validator";

import {
  createAsset,
  getallAsset,
  getAsset,
  registerDrone,
  removeAsset,
  toggleAsset,
  updateAsset,
} from "../../controllers/v1/assetController";
import { PERMS } from "../../schemas/permission";
import { isAuthenticated, PermissionGuard } from "../../utils/authUtils";
import { validator, RobustRunner } from "../../utils/requestHelpers";

const router = express.Router();

router.post(
  "/register-drone",
  isAuthenticated,
  body("serialNo").isString().notEmpty(),
  body("modelName").isString().notEmpty(),
  validator,
  RobustRunner(registerDrone),
);

router.post(
  "/create",
  isAuthenticated,
  body("assetName").notEmpty().isString().trim(),
  body("userID").notEmpty().isMongoId(),
  body("assetInfo").exists().isArray(),
  body("model").notEmpty().isMongoId(),
  body("assetOwner").notEmpty().isMongoId(),
  //adding date format
  body("manufactureDate").exists().isISO8601().toDate(),
  body("manufactureID").notEmpty().isMongoId(),
  validator,
  PermissionGuard(PERMS.ASSET_CREATE),
  RobustRunner(createAsset),
);

router.get(
  "/get",
  isAuthenticated,
  query("assetID").notEmpty().isMongoId(),
  validator,
  PermissionGuard(PERMS.ASSET_LIST),
  RobustRunner(getAsset),
);

router.get(
  "/get-all-asset",
  isAuthenticated,
  PermissionGuard(PERMS.ASSET_LIST),
  RobustRunner(getallAsset),
);

router.patch(
  "/update",
  isAuthenticated,
  body("userID").notEmpty().isMongoId(),
  body("tenantID").notEmpty().isMongoId(),
  body("assetID").notEmpty().isMongoId(),
  body("assetInfo").notEmpty().isArray(),
  validator,
  PermissionGuard(PERMS.ASSET_UPDATE),
  RobustRunner(updateAsset),
);

router.delete(
  "/delete",
  isAuthenticated,
  body("assetID").notEmpty().isMongoId(),
  validator,
  PermissionGuard(PERMS.ASSET_DELETE),
  RobustRunner(removeAsset),
);

router.patch(
  "/toggle-asset-status",
  isAuthenticated,
  body("assetID").notEmpty().isMongoId(),
  body("isActive").notEmpty().isBoolean().toBoolean(),
  PermissionGuard(PERMS.ASSET_UPDATE),
  validator,
  RobustRunner(toggleAsset),
);

export default router;
