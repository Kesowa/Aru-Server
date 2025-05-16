import express from "express";
import { body, param, query } from "express-validator";

import { PERMS } from "../../schemas/permission";
import { isAuthenticated, PermissionGuard } from "../../utils/authUtils";
import { validator, RobustRunner } from "../../utils/requestHelpers";

import { createIcon, listIcon, deleteIcon } from "../../controllers/v1/iconController";


const router = express.Router();

router.get(
  "/list",
  isAuthenticated,

  query("name").optional({ checkFalsy: true }).isString().isLength({ min: 3, max: 32 }),
  query("tags").optional({ checkFalsy: true }).customSanitizer(value => Array.isArray(value) ? value : [value]).isArray({ min: 1, max: 4 }),

  validator,
  PermissionGuard(PERMS.LAYER_LIST),
  RobustRunner(listIcon),
)

router.post(
  "/create",
  isAuthenticated,

  body("name").notEmpty().isString().isLength({ min: 3, max: 32 }),
  body("description").default("").isString().isLength({ min: 0, max: 128 }),
  body("tags").default([]).isArray({ min: 0, max: 4 }),
  body("image").notEmpty().isString(),
  validator,
  PermissionGuard(PERMS.UPLOAD_LAYER),
  RobustRunner(createIcon),
);

router.delete(
  "/:iconID",
  isAuthenticated,

  param("iconID").notEmpty().isMongoId(),
  validator,
  PermissionGuard(PERMS.DELETE_LAYER),
  RobustRunner(deleteIcon),
)

export default router;
