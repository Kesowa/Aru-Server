import express from "express";
import { body, param, query } from "express-validator";
import {
  CreateDocThread,
  AddorUpdateDocComment,
  GetDocThread,
  RemoveDocComment,
} from "../../controllers/v1/threadController";
import {
  isAuthenticated,
  canCreateThread,
  canUpdateThread,
  canDeleteComment,
  canListThread,
} from "../../utils/authUtils";
import { validator, RobustRunner } from "../../utils/requestHelpers";

const router = express.Router();

router.get(
  "/:docType/:docId",
  param("docType").isString(),
  param("docId").isMongoId(),
  query("ifExist").optional().isBoolean(),
  validator,
  isAuthenticated,
  canListThread,
  RobustRunner(GetDocThread)
);
router.post(
  "/:docType/:docId",
  param("docType").isString(),
  param("docId").isMongoId(),
  validator,
  isAuthenticated,
  canCreateThread,
  RobustRunner(CreateDocThread)
);
router.patch(
  "/:docType/:docId",
  param("docType").isString(),
  param("docId").isMongoId(),
  body("commentId").optional().isMongoId(),
  body("content").isString().isLength({ min: 10, max: 500 }),
  validator,
  isAuthenticated,
  canUpdateThread,
  RobustRunner(AddorUpdateDocComment)
);
router.delete(
  "/:docType/:docId/:commentId",
  param("docType").isString(),
  param("docId").isMongoId(),
  param("commentId").isMongoId(),
  validator,
  isAuthenticated,
  canDeleteComment,
  RobustRunner(RemoveDocComment)
);

export default router;
