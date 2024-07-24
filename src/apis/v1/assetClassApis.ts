import express from "express";
import { body, query, header } from "express-validator";
import {
  createAssetClass,
  fetchAssetbyId,
  getAssetClass,
  removeAssetClass,
  updateAssetClass,
} from "../../controllers/v1/assetClassController";
import { isAuthenticated, PermissionGuard, } from "../../utils/authUtils";
import { validator, RobustRunner } from "../../utils/requestHelpers";
import { PERMS } from "../../schemas/permission";

const router = express.Router();

router.post(
  "/create",
  isAuthenticated,
  body("typeName").notEmpty().isString(),
  //add date regex in isDate()
  body("createdAt").optional().isISO8601().toDate(),
  header("userid").notEmpty().isMongoId(),
  validator,
  PermissionGuard(PERMS.ASSET_CLASS_CREATE),
  RobustRunner(createAssetClass)
);

router.get(
  "/get",
  isAuthenticated,
  PermissionGuard(PERMS.ASSET_CLASS_LIST),
  RobustRunner(getAssetClass)
);

router.patch(
  "/update",
  isAuthenticated,
  body("id").notEmpty().isMongoId(),
  body("typeName").notEmpty().isString(),
  validator,
  PermissionGuard(PERMS.ASSET_CLASS_UPDATE),
  RobustRunner(updateAssetClass)
);

router.get(
  "/get-asset-class-by-id",
  isAuthenticated,
  query("_id").notEmpty().isMongoId(),
  validator,
  PermissionGuard(PERMS.ASSET_CLASS_LIST),
  RobustRunner(fetchAssetbyId)
);

router.delete(
  "/delete",
  isAuthenticated,
  body("id").notEmpty().isMongoId(),
  validator,
  PermissionGuard(PERMS.ASSET_CLASS_DELETE),
  RobustRunner(removeAssetClass)
);

export default router;
