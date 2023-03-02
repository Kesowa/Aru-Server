import express from "express";
import { body, header, query } from "express-validator";
import {
  createModel,
  fetchModelbyId,
  getModel,
  removeModel,
  updateModel,
} from "../../controllers/v1/modelController";
import {
  canCreateModel,
  canDeleteModel,
  canListModel,
  canUpdateModel,
  isAuthenticated,
} from "../../utils/authUtils";
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
  canCreateModel,
  RobustRunner(createModel)
);

router.get("/get", isAuthenticated, canListModel, RobustRunner(getModel));

router.get(
  "/get-by-id",
  isAuthenticated,
  query("_id").notEmpty().isMongoId(),
  validator,
  canListModel,
  RobustRunner(fetchModelbyId)
);

router.patch(
  "/update",
  isAuthenticated,
  body("id").notEmpty().isMongoId(),
  body("update").exists({ checkFalsy: true }).isObject(),
  validator,
  canUpdateModel,
  RobustRunner(updateModel)
);

router.delete(
  "/delete",
  isAuthenticated,
  body("id").notEmpty().isMongoId(),
  validator,
  canDeleteModel,
  RobustRunner(removeModel)
);

export default router;
