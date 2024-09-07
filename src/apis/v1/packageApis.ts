import express from "express";
import { body, query } from "express-validator";
import {
  createPackage,
  fetchAllPackages,
  fetchActivePackages,
  editPackageForId,
  deletePackageForId,
  fetchPackageById,
} from "../../controllers/v1/packageController";
import { uploadFileforUSer } from "../../controllers/v1/commonController";
import { isAuthenticated, PermissionGuard } from "../../utils/authUtils";
import multer from "multer";
import { multerStorage } from "../../utils/fileUploadUtils";
import { validator, RobustRunner } from "../../utils/requestHelpers";
import { Directory } from "../../constants";
import { PERMS } from "../../schemas/permission";
const upload = multer({ storage: multerStorage(Directory.TEMP_IMAGES) });
const router = express.Router();

//++++++++++++++++++++ package poster upload Api++++++++++++++++++++++++
router.post(
  "/upload-poster",
  isAuthenticated,
  upload.single("poster"),
  RobustRunner(uploadFileforUSer)
);

//++++++++++++++++++++ package creation Api +++++++++++++++++++++++++++++
router.post(
  "/create",
  isAuthenticated,
  body("name").notEmpty().trim(),
  body("bandwidth").notEmpty().isNumeric().toInt(),
  body("storage").notEmpty().isNumeric().toInt(),
  body("duration").notEmpty().isNumeric().toInt(),
  body("userCount").notEmpty().isNumeric().toInt(),
  body("missionCount").notEmpty().isNumeric().toInt(),
  body("layerCount").notEmpty().isNumeric().toInt(),
  body("alertCount").notEmpty().isNumeric().toInt(),
  body("vodCount").notEmpty().isNumeric().toInt(),
  body("clientCount").notEmpty().isNumeric().toInt(),
  body("locationCount").notEmpty().isNumeric().toInt(),
  body("userGroupCount").notEmpty().isNumeric().toInt(),
  body("poster").optional().notEmpty().trim(),
  validator,
  PermissionGuard(PERMS.PACKAGE_CREATE),
  RobustRunner(createPackage)
);

//fetch all packages
router.get(
  "/fetchall",
  isAuthenticated,
  PermissionGuard(PERMS.PACKAGE_LIST),
  RobustRunner(fetchAllPackages)
);

//fetch package by id
router.get(
  "/fetch-by-id",
  isAuthenticated,
  query("id").isMongoId().withMessage("Invalid id"),
  PermissionGuard(PERMS.PACKAGE_LIST),
  RobustRunner(fetchPackageById)
);

//fetch active packages
router.get(
  "/fetchactive",
  isAuthenticated,
  PermissionGuard(PERMS.PACKAGE_LIST),
  RobustRunner(fetchActivePackages)
);

router.patch(
  "/edit-package-for-Id",
  isAuthenticated,
  body("_id").notEmpty().isMongoId(),
  body("name").notEmpty().trim(),
  body("bandwidth").notEmpty().isNumeric().toInt(),
  body("storage").notEmpty().isNumeric().toInt(),
  body("duration").notEmpty().isNumeric().toInt(),
  body("userCount").notEmpty().isNumeric().toInt(),
  body("missionCount").notEmpty().isNumeric().toInt(),
  body("layerCount").notEmpty().isNumeric().toInt(),
  body("alertCount").notEmpty().isNumeric().toInt(),
  body("vodCount").notEmpty().isNumeric().toInt(),
  body("clientCount").notEmpty().isNumeric().toInt(),
  body("locationCount").notEmpty().isNumeric().toInt(),
  body("userGroupCount").notEmpty().isNumeric().toInt(),
  body("poster").optional().notEmpty().trim(),
  validator,
  PermissionGuard(PERMS.PACKAGE_UPDATE),
  RobustRunner(editPackageForId)
);

router.delete(
  "/delete-package-for-Id",
  isAuthenticated,
  body("_id").notEmpty().isMongoId(),
  PermissionGuard(PERMS.PACKAGE_DELETE),
  RobustRunner(deletePackageForId)
);
export default router;
