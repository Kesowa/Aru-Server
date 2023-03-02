import express from "express";
import { body, header, query } from "express-validator";
import {
  createManufacturer,
  fetchManufacturerbyId,
  getManufacturer,
  removeManufacturer,
  updateManufacturer,
} from "../../controllers/v1/manufacturerController";
import {
  isAuthenticated,
  canCreateManufacturer,
  canUpdateManufacturer,
  canDeleteManufacturer,
  canListManufacturer,
} from "../../utils/authUtils";
import { validator, RobustRunner } from "../../utils/requestHelpers";

const router = express.Router();

router.post(
  "/create",
  isAuthenticated,
  body("name").notEmpty().trim(),
  body("address").notEmpty().trim(),
  body("nationality").notEmpty().trim(),
  body("website").notEmpty().trim(),
  body("contacts").notEmpty().isArray({ min: 1 }),
  header("userid").notEmpty().isMongoId(),
  validator,
  canCreateManufacturer,
  RobustRunner(createManufacturer)
);

router.get(
  "/get",
  isAuthenticated,
  canListManufacturer,
  RobustRunner(getManufacturer)
);

router.get(
  "/get-by-id",
  isAuthenticated,
  query("_id").notEmpty().isMongoId(),
  validator,
  canListManufacturer,
  RobustRunner(fetchManufacturerbyId)
);

router.patch(
  "/update",
  isAuthenticated,
  body("id").notEmpty().isMongoId(),
  body("update").exists().isObject(),
  validator,
  canUpdateManufacturer,
  RobustRunner(updateManufacturer)
);

router.delete(
  "/delete",
  isAuthenticated,
  body("id").notEmpty().isMongoId(),
  validator,
  canDeleteManufacturer,
  RobustRunner(removeManufacturer)
);

export default router;
