import { Router } from "express";
import { isAuthenticated } from "../../utils/authUtils";
const router = Router();
import {
  createLayerGroup,
  editLayerGroup,
  fetchLayergroup,
  deleteLayerGroup,
  deleteLayerId,
} from "../../controllers/v1/layerGroupControllers";
import { body, query } from "express-validator";
import { validator, RobustRunner } from "../../utils/requestHelpers";
router.post(
  "/create",
  isAuthenticated,
  body("name").notEmpty().trim(),
  body("layers").notEmpty().isArray({ min: 1 }),
  validator,
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
  RobustRunner(editLayerGroup)
);
router.get(
  "/fetch",
  isAuthenticated,
  body("_id").notEmpty().isMongoId(),
  validator,
  RobustRunner(fetchLayergroup)
);
router.delete(
  "/delete",
  isAuthenticated,
  query("_id").notEmpty().isMongoId(),
  validator,
  RobustRunner(deleteLayerGroup)
);
router.post(
  "/delete-layerId",
  isAuthenticated,
  body("_id").notEmpty().isMongoId(),
  body("layers").notEmpty().isArray({ min: 1 }),
  validator,
  RobustRunner(deleteLayerId)
);

export default router;
