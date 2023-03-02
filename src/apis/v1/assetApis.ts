import express from "express";
import { body, header, query } from "express-validator";
import {
  createAsset,
  getallAsset,
  getAsset,
  registerDrone,
  removeAsset,
  toggleAsset,
  updateAsset,
} from "../../controllers/v1/assetController";
import {
  isAuthenticated,
  canCreateAsset,
  canUpdateAsset,
  canDeleteAsset,
  canListAsset,
} from "../../utils/authUtils";
import { validator, RobustRunner } from "../../utils/requestHelpers";

const router = express.Router();

router.post(
  "/register-drone",
  isAuthenticated,
  body("serialNo").isString().notEmpty(),
  body("modelName").isString().notEmpty(),
  validator,
  RobustRunner(registerDrone)
);

router.post(
  "/create",
  isAuthenticated,
  body("assetName").notEmpty().isString().trim(),
  body("userID").notEmpty().isMongoId(),
  body("assetInfo").exists().isArray(),
  header("userid").notEmpty().isMongoId(),
  body("model").notEmpty().isMongoId(),
  body("assetOwner").notEmpty().isMongoId(),
  //adding date format
  body("manufactureDate").exists().isISO8601().toDate(),
  body("manufactureID").notEmpty().isMongoId(),
  validator,
  canCreateAsset,
  RobustRunner(createAsset)
);

router.get(
  "/get",
  isAuthenticated,
  query("assetID").notEmpty().isMongoId(),
  validator,
  canListAsset,
  RobustRunner(getAsset)
);

router.get(
  "/get-all-asset",
  isAuthenticated,
  canListAsset,
  RobustRunner(getallAsset)
);

router.patch(
  "/update",
  isAuthenticated,
  body("userID").notEmpty().isMongoId(),
  body("tenantID").notEmpty().isMongoId(),
  body("assetID").notEmpty().isMongoId(),
  body("assetInfo").notEmpty().isArray(),
  validator,
  canUpdateAsset,
  RobustRunner(updateAsset)
);

router.delete(
  "/delete",
  isAuthenticated,
  body("assetID").notEmpty().isMongoId(),
  validator,
  canDeleteAsset,
  RobustRunner(removeAsset)
);

router.patch(
  "/toggle-asset-status",
  isAuthenticated,
  body("assetID").notEmpty().isMongoId(),
  body("isActive").notEmpty().isBoolean().toBoolean(),
  validator,
  RobustRunner(toggleAsset)
);

export default router;
