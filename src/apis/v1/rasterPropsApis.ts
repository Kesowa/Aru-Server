import express from "express";
import { isAuthenticated } from "../../utils/authUtils";
const router = express.Router();
import {
  createRasterProps,
  getRasterPropsById,
  getAllRasterProps,
} from "../../controllers/v1/rasterPropsController";
import { body, query } from "express-validator";
import { validator } from "../../utils/requestHelpers";

router.post(
  "/create",
  isAuthenticated,
  body("name").isString().notEmpty().trim(),
  body("bidx").optional().notEmpty().trim(),
  body("bandExp").optional().notEmpty().trim(),
  body("colorMap").optional().notEmpty().trim(),
  body("resamplingMethod").optional().notEmpty().trim(),
  validator,
  createRasterProps
);

// ************** get method *************
router.get(
  "/get-by-ID",
  isAuthenticated,
  query("id").optional().notEmpty().isMongoId(),
  validator,
  getRasterPropsById
);
router.get("/get-all-rasterProps", isAuthenticated, getAllRasterProps);
export default router;
