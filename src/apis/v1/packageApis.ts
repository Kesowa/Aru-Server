import express from "express";
import { body } from "express-validator";
import {
  createPackage,
  fetchAllPackages,
  fetchActivePackages,
  editPackageForId,
  deletePackageForId,
} from "../../controllers/v1/packageController";
// import { uploadFileforUSer } from "../../controllers/v1/commonController";
import { isAuthenticated, onlySuperAdminAccess } from "../../utils/authUtils";
import { validator, RobustRunner } from "../../utils/requestHelpers";
const router = express.Router();

//++++++++++++++++++++ package poster upload Api++++++++++++++++++++++++
// router.post(
//   "/upload-poster",
//   isAuthenticated,
//   body("poster").notEmpty().isMongoId(),
//   RobustRunner(uploadFileforUSer)
// );

//++++++++++++++++++++ package creation Api +++++++++++++++++++++++++++++
router.post(
  "/create",
  isAuthenticated,
  onlySuperAdminAccess,
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
  RobustRunner(createPackage)
);

//fetch all packages
router.get(
  "/fetchall",
  isAuthenticated,
  onlySuperAdminAccess,
  RobustRunner(fetchAllPackages)
);

//fetch active packages
router.get(
  "/fetchactive",
  isAuthenticated,
  onlySuperAdminAccess,
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
  RobustRunner(editPackageForId)
);

router.delete(
  "/delete-package-for-Id",
  isAuthenticated,
  body("_id").notEmpty().isMongoId(),
  RobustRunner(deletePackageForId)
);
export default router;
