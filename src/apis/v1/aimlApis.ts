import { Router } from "express";
import { param, query } from "express-validator";

import {
  inferVodViolence,
  fetchAimlTasks,
  inferLayerProcessing,
} from "../../controllers/v1/aimlController";
import { isAuthenticated } from "../../utils/authUtils";
import { RobustRunner, validator } from "../../utils/requestHelpers";

const router = Router();

router.post(
  "/vod/:vodId/:inferType/infer",
  isAuthenticated,
  param("vodId").isMongoId(),
  validator,
  RobustRunner(inferVodViolence),
);

router.get(
  "/:docModel/:docId",
  param("docModel").isString(),
  param("docId").isMongoId(),
  query("infer").optional().isString().isIn(["violence", "deepforest"]),
  validator,
  isAuthenticated,
  RobustRunner(fetchAimlTasks),
);

router.post(
  "/layer/:layerId/:inferType/infer",
  isAuthenticated,
  param("layerId").isMongoId(),
  validator,
  RobustRunner(inferLayerProcessing),
);

export default router;
