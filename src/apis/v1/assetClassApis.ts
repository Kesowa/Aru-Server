import express from "express";
import { body, query, header } from "express-validator";
import {
  createAssetClass,
  fetchAssetbyId,
  getAssetClass,
  removeAssetClass,
  updateAssetClass,
} from "../../controllers/v1/assetClassController";
import {
  isAuthenticated,
  onlySuperAdminAccess,
  canListAssetClass,
} from "../../utils/authUtils";
import { validator, RobustRunner } from "../../utils/requestHelpers";

const router = express.Router();

router.post(
  "/create",
  isAuthenticated,
  body("typeName").notEmpty().isString(),
  //add date regex in isDate()
  body("createdAt").optional().isISO8601().toDate(),
  header("userid").notEmpty().isMongoId(),
  validator,
  onlySuperAdminAccess,
  RobustRunner(createAssetClass)
);

router.get(
  "/get",
  isAuthenticated,
  canListAssetClass,
  RobustRunner(getAssetClass)
);

router.patch(
  "/update",
  isAuthenticated,
  body("id").notEmpty().isMongoId(),
  body("typeName").notEmpty().isString(),
  validator,
  onlySuperAdminAccess,
  RobustRunner(updateAssetClass)
);

router.get(
  "/get-asset-class-by-id",
  isAuthenticated,
  query("_id").notEmpty().isMongoId(),
  validator,
  canListAssetClass,
  RobustRunner(fetchAssetbyId)
);

router.delete(
  "/delete",
  isAuthenticated,
  body("id").notEmpty().isMongoId(),
  validator,
  onlySuperAdminAccess,
  RobustRunner(removeAssetClass)
);

export default router;
