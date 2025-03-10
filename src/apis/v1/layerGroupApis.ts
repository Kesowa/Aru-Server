import { Router } from "express";
import { body, query } from "express-validator";

import {
  createLayerGroup,
  editLayerGroup,
  fetchLayergroup,
  deleteLayerGroup,
  deleteLayerId,
} from "../../controllers/v1/layerGroupControllers";
import { PERMS } from "../../schemas/permission";
import { isAuthenticated, PermissionGuard } from "../../utils/authUtils";
import { validator, RobustRunner } from "../../utils/requestHelpers";
const router = Router();

router.post(
  "/create",
  isAuthenticated,
  body("name").notEmpty().trim(),
  body("layers").notEmpty().isArray({ min: 1 }),
  validator,
  PermissionGuard(PERMS.UPLOAD_LAYER),
  RobustRunner(createLayerGroup)
);
router.patch(
  "/edit",
  isAuthenticated,
  body("_id").notEmpty().isMongoId(),
  body("name").optional().notEmpty().trim(),
  // for the renaming request, the layers field is empty array
  // for adding/removing layers from group, the layers field is non-empty
  body("layers").exists({ checkFalsy: true }).isArray(),
  validator,
  PermissionGuard(PERMS.EDIT_LAYER),
  RobustRunner(editLayerGroup)
);
router.get(
  "/fetch",
  isAuthenticated,
  body("_id").notEmpty().isMongoId(),
  validator,
  PermissionGuard(PERMS.LAYER_LIST),
  RobustRunner(fetchLayergroup)
);
router.delete(
  "/delete",
  isAuthenticated,
  query("_id").notEmpty().isMongoId(),
  validator,
  PermissionGuard(PERMS.DELETE_LAYER),
  RobustRunner(deleteLayerGroup)
);
router.post(
  "/delete-layerId",
  isAuthenticated,
  body("_id").notEmpty().isMongoId(),
  body("layers").notEmpty().isArray({ min: 1 }),
  validator,
  PermissionGuard(PERMS.DELETE_LAYER),
  RobustRunner(deleteLayerId)
);

export default router;
