import express from "express";
import {
  isAuthenticated,
  canUploadDocument,
  canDeleteDocument,
} from "../../utils/authUtils";
const router = express.Router();
import multer from "multer";
import {
  createDocument,
  deleteDocument,
  deletemultipleDocument,
  getbymissionID,
  zipbymissionId,
  gen2x,
  updateSizeExistDoc,
  updateMultiDoc,
  updateDoc,
} from "../../controllers/v1/documentController";
import { isSize } from "../../utils/sizePermission";
import { body, query } from "express-validator";
import { validator } from "../../utils/requestHelpers";
import { Directory } from "../../constants";
import { multerStorage } from "../../utils/fileUploadUtils";

const upload = multer({ storage: multerStorage(Directory.DOCUMENTS) });

// ****************create document**********************

router.post(
  "/create",
  isAuthenticated,
  upload.single("file"),
  body("missionId").notEmpty(),
  body("folderName").notEmpty().trim(),
  body("type").optional().trim(),
  validator,
  canUploadDocument,
  isSize,
  createDocument
);

// ********* delete  Document*************
router.delete(
  "/delete",
  isAuthenticated,
  query("id").notEmpty(),
  validator,
  canDeleteDocument,
  deleteDocument
);

// ********* delete  multiple Document*************

router.delete(
  "/delete-multiple",
  isAuthenticated,
  body("id").isArray({ min: 1 }),
  validator,
  canDeleteDocument,
  deletemultipleDocument
);

// ********* fetch Document by missionID  *************
router.get(
  "/getbymissionId",
  isAuthenticated,
  query("missionId").notEmpty(),
  query("isFlagged").optional().isBoolean().toBoolean(),
  validator,
  getbymissionID
);

router.get(
  "/zipbyId",
  isAuthenticated,
  query("missionId").notEmpty(),
  query("folderName").trim(),
  validator,
  zipbymissionId
);

router.patch(
  "/gen_2x_documents",
  isAuthenticated,
  body("filePath").isString().trim(),
  body("folderName").isString().trim(),
  validator,
  gen2x
);

router.patch("/update-size-for-exist-doc", isAuthenticated, updateSizeExistDoc);

router.patch(
  "/update-doc-by-ID",
  isAuthenticated,
  body("Id").notEmpty().isMongoId(),
  body("update").notEmpty().isObject(),
  validator,
  updateDoc
);

router.patch(
  "/update-multi-docs-by-ID",
  isAuthenticated,
  body("Id").notEmpty().isArray({ min: 1 }),
  body("update").notEmpty().isObject(),
  validator,
  updateMultiDoc
);

export default router;
