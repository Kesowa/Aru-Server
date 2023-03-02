import express from "express";
import { body } from "express-validator";
import {
  broadcasterController,
  getActiveStreams,
} from "../../controllers/v1/webrtcControllers";
import { consumerContoller } from "../../socketControllers/v1/mavstatsController";
import { validator, RobustRunner } from "../../utils/requestHelpers";
// import { canFly, canViewRTCstream, isAuthenticated } from '../../utils/authUtils';

const router = express.Router();

// Only pilots are are allowed to stream using this api
router.post(
  "/broadcaster" /*isAuthenticated, canFly,*/,
  body("missionId").notEmpty().isMongoId(),
  body("sdp").exists().isObject(),
  validator,
  RobustRunner(broadcasterController)
);

// Only users with webrtc_view or mission_list permission can acess this endpoint
router.post(
  "/consumer" /*isAuthenticated, canViewRTCstream,*/,
  body("missionId").notEmpty().isMongoId(),
  body("sdp").exists().isObject(),
  validator,
  RobustRunner(consumerContoller)
);

router.get("/get-active-streams", getActiveStreams);

export default router;
