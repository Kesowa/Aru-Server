import { Router } from "express";
import { body, param } from "express-validator";
import { callbackVodViolence, inferVodViolence } from "../../controllers/v1/aimlController";
import { isAuthenticated } from "../../utils/authUtils";
import { RobustRunner, validator } from "../../utils/requestHelpers";

const router = Router();

router.post("/vod/:vodId/violence/infer", isAuthenticated, param("vodId").isMongoId(), validator, RobustRunner(inferVodViolence));
router.post("/vod/:taskId/violence/callback", param("taskId").isMongoId(), body("Keys").isArray(), body("Values").isArray(), validator, RobustRunner(callbackVodViolence));

export default router;
