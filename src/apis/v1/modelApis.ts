import express from "express";
import { body, header, query } from "express-validator";

import {
  createModel,
  fetchModelbyId,
  getModel,
  removeModel,
  updateModel,
} from "../../controllers/v1/modelController";
import { PERMS } from "../../schemas/permission";
import { PermissionGuard, isAuthenticated } from "../../utils/authUtils";
import { validator, RobustRunner } from "../../utils/requestHelpers";

const router = express.Router();

router.post(
  "/create",
  isAuthenticated,
  body("modelName").notEmpty().trim(),
  body("modelNumber").notEmpty().trim(),
  body("assetClassID").notEmpty().isMongoId(),
  body("dimensions").exists({ checkFalsy: true }).isObject(),
  body("manufacturerID").notEmpty().isMongoId(),
  body("website").notEmpty().trim(),
  header("userid").notEmpty().isMongoId(),
  body("props").exists({ checkFalsy: true }).isObject(),
  validator,
  PermissionGuard(PERMS.MODEL_CREATE),
  RobustRunner(createModel),
);

router.get(
  "/get",
  isAuthenticated,
  PermissionGuard(PERMS.MODEL_LIST),
  RobustRunner(getModel),
);

router.get(
  "/get-by-id",
  isAuthenticated,
  query("_id").notEmpty().isMongoId(),
  validator,
  PermissionGuard(PERMS.MODEL_LIST),
  RobustRunner(fetchModelbyId),
);

router.patch(
  "/update",
  isAuthenticated,
  body("id").notEmpty().isMongoId(),
  body("update").exists({ checkFalsy: true }).isObject(),
  validator,
  PermissionGuard(PERMS.MODEL_UPDATE),
  RobustRunner(updateModel),
);

router.delete(
  "/delete",
  isAuthenticated,
  body("id").notEmpty().isMongoId(),
  validator,
  PermissionGuard(PERMS.MODEL_DELETE),
  RobustRunner(removeModel),
);

export default router;
