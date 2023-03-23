import express from "express";
import expressValidator from "express-validator";
import {
  AddAlertComment,
  GetAlertThread,
  RemoveAlertComment,
} from "../../controllers/v1/threadController";
import {
  isAuthenticated,
  canListAlert,
  canUpdateAlert,
  canDeleteAlert,
  canListMission,
  canListVOD,
} from "../../utils/authUtils";
import { validator, RobustRunner } from "../../utils/requestHelpers";

const router = express.Router();

// Alert
const alertRouter = express.Router();
alertRouter.get(
  "/:docId",
  expressValidator.param("docId").isMongoId(),
  validator,
  isAuthenticated,
  canListAlert,
  RobustRunner(GetAlertThread)
);
alertRouter.patch(
  "/:docId",
  expressValidator.param("docId").isMongoId(),
  expressValidator.body("content").isString().isLength({ min: 10, max: 500 }),
  validator,
  isAuthenticated,
  canUpdateAlert,
  RobustRunner(AddAlertComment)
);
alertRouter.delete(
  "/:docId/:commentId",
  expressValidator.param("docId").isMongoId(),
  expressValidator.param("commentId").isMongoId(),
  validator,
  isAuthenticated,
  canDeleteAlert,
  RobustRunner(RemoveAlertComment)
);
router.use("/alert", alertRouter);

// Document
const documentRouter = express.Router();
documentRouter.get(
  "/:docId",
  expressValidator.param("docId").isMongoId(),
  validator,
  isAuthenticated,
  canListMission
);
router.use("/document", documentRouter);

// VOD
const vodRouter = express.Router();
vodRouter.get(
  "/:docId",
  expressValidator.param("docId").isMongoId(),
  validator,
  isAuthenticated,
  canListVOD
);
router.use("/vod", vodRouter);

export default router;
