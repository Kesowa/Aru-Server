import express from "express";
import { isAuthenticated, PermissionGuard } from "../../utils/authUtils";
import {
  getActiveStreams,
  removeStreamKey,
  streamKeyGen,
  streamTokenValidator,
  getActiveStreamByFlightId,
} from "../../controllers/v1/streamTokenController";
import { body, query } from "express-validator";
import { validator, RobustRunner } from "../../utils/requestHelpers";
import { PERMS } from "../../schemas/permission";

const router = express.Router();

//+++++++++++++++++++++++Stream Token Generation +++++++++++++++++++++++++++
router.post(
  "/gen-stream-token",
  isAuthenticated,
  body("missionID").isString().notEmpty().isMongoId(),
  body("flightID").isString().notEmpty().isMongoId(),
  body("assetID").isString().notEmpty().isMongoId(),
  body("locationID")
    .default("5f202f03b9225726102721b8")
    .isString()
    .notEmpty()
    .isMongoId(),
  validator,
  PermissionGuard(PERMS.STREAM_CREATE),
  RobustRunner(streamKeyGen)
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
  PermissionGuard(PERMS.STREAM_LIST),
  RobustRunner(getActiveStreams)
);

//+++++++++++++++++++++ Get Active streams by Flight-id ++++++++++++++++++++
router.get(
  "/get-active-stream/flight",
  isAuthenticated,
  query("flightID").notEmpty().isMongoId(),
  validator,
  PermissionGuard(PERMS.STREAM_LIST),
  RobustRunner(getActiveStreamByFlightId)
);

//++++++++++++++++++++ remove streamkey after it has done streaming ++++++++++++++
//++++++++++++++++++++++++CHANGED FROM DELETE TO POST++++++++++++++++++++++
router.post(
  "/remove-token",
  isAuthenticated,
  body("name").notEmpty().trim(),
  validator,
  PermissionGuard(PERMS.STREAM_DELETE),
  RobustRunner(removeStreamKey)
);

export default router;
