import express from "express";
import { body, param, query } from "express-validator";
import {
  CreateDocThread,
  AddorUpdateDocComment,
  GetDocThread,
  RemoveDocComment,
} from "../../controllers/v1/threadController";
import { isAuthenticated, PermissionGuard } from "../../utils/authUtils";
import { validator, RobustRunner } from "../../utils/requestHelpers";
import { PERMS } from "../../schemas/permission";

const router = express.Router();

router.get(
  "/:docType/:docId",
  param("docType").isString(),
  param("docId").isMongoId(),
  query("ifExist").optional().isBoolean(),
  validator,
  isAuthenticated,
  PermissionGuard(PERMS.THREAD_LIST),
  RobustRunner(GetDocThread)
);
router.post(
  "/:docType/:docId",
  param("docType").isString(),
  param("docId").isMongoId(),
  validator,
  isAuthenticated,
  PermissionGuard(PERMS.THREAD_CREATE),
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
  PermissionGuard(PERMS.THREAD_UPDATE),
  RobustRunner(AddorUpdateDocComment)
);
router.delete(
  "/:docType/:docId/:commentId",
  param("docType").isString(),
  param("docId").isMongoId(),
  param("commentId").isMongoId(),
  validator,
  isAuthenticated,
  PermissionGuard(PERMS.COMMENT_DELETE),
  RobustRunner(RemoveDocComment)
);

export default router;
