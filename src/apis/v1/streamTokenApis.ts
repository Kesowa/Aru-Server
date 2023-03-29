import express from "express";
import { isAuthenticated, canFly } from "../../utils/authUtils";
import {
  getActiveStreams,
  channelCreationAWS,
  streamTokenValidator,
  getActiveStreamByFlightId,
  removeChannelandInput,
} from "../../controllers/v1/streamTokenController";
import { body, query } from "express-validator";
import { validator, RobustRunner } from "../../utils/requestHelpers";

const router = express.Router();

//+++++++++++++++++++++++Stream Token Generation +++++++++++++++++++++++++++
router.post(
  "/gen-stream-token",
  isAuthenticated,
  body("missionID").isString().notEmpty(),
  body("flightID").isString().notEmpty(),
  body("assetID").isString().notEmpty(),
  body("locationID").default("5f202f03b9225726102721b8").isString().notEmpty(),
  validator,
  canFly,
  RobustRunner(channelCreationAWS)
);

//+++++++++++++++++++++Stream Token Valiation ++++++++++++++++++++++++++++++
router.post(
  "/validate-token",
  body("name").isString().notEmpty(),
  validator,
  RobustRunner(streamTokenValidator)
);

//+++++++++++++++++++++ Get Active streams by Tenant-id ++++++++++++++++++++
router.get(
  "/get-active-streams",
  isAuthenticated,
  RobustRunner(getActiveStreams)
);

//+++++++++++++++++++++ Get Active streams by Flight-id ++++++++++++++++++++
router.get(
  "/get-active-stream/flight",
  isAuthenticated,
  query("flightID").notEmpty().isMongoId(),
  validator,
  RobustRunner(getActiveStreamByFlightId)
);

//++++++++++++++++++++ remove streamkey after it has done streaming ++++++++++++++
//++++++++++++++++++++++++CHANGED FROM DELETE TO POST++++++++++++++++++++++
router.post(
  "/remove-token",
  isAuthenticated,
  body("name").notEmpty().trim(),
  validator,
  RobustRunner(removeChannelandInput)
);

export default router;
