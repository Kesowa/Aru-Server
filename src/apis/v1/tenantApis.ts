import express from "express";
import { body } from "express-validator";
import {
  createTenant,
  fetchAllTenants,
  addInitialPackageByAdmin,
  deleteTenantForId,
  fetchTenantDetails,
  addAllCountToTenant,
  addActualSizeToTenant,
  editTenantForId,
  getTenantStats,
  createTenantPublicApi,
  verifyTenant,
  resendVerificationCode,
  tenantpublicmaprefupdate,
} from "../../controllers/v1/tenantController";
import { uploadFile } from "../../controllers/v1/commonController";
import { isAuthenticated, PermissionGuard } from "../../utils/authUtils";
import { multerStorage } from "../../utils/fileUploadUtils";
import multer from "multer";
import { fetchActivePackages } from "../../controllers/v1/packageController";
import {
  validator,
  RobustRunner,
  environmentGuard,
} from "../../utils/requestHelpers";
import { Directory, Mode } from "../../constants";
import { PERMS } from "../../schemas/permission";

const upload = multer({ storage: multerStorage(Directory.TENANT_LOGOS) });
const router = express.Router();

//++++++++++++++++++++ package poster upload Api++++++++++++++++++++++++
router.post(
  "/upload-avatar",
  isAuthenticated,
  upload.single("avatar"),
  RobustRunner(uploadFile)
);

//++++++++++++++++++++ Tenant creation Api +++++++++++++++++++++++++++++
router.post(
  "/create",
  isAuthenticated,
  body("name").notEmpty().trim(),
  body("phoneNo").isString().notEmpty(),
  body("email").notEmpty().isEmail().withMessage("invalid Email."),
  body("activePackage").notEmpty().isMongoId(),
  body("contactPerson").notEmpty().trim(),
  body("registrationNumber").optional().notEmpty().isNumeric().toInt(),
  body("officialWebsite").optional().notEmpty().trim(),
  body("gstNumber").notEmpty().isNumeric().toInt(),
  body("billingAddressLine1").notEmpty().trim(),
  body("billingAddressLine2").optional().notEmpty().trim(),
  body("billingCity").notEmpty().trim(),
  body("billingDistrict").notEmpty().trim(),
  body("billingState").notEmpty().trim(),
  body("billingPin").notEmpty().isPostalCode("IN"),
  body("avatar").optional().notEmpty().trim(),
  validator,
  PermissionGuard(PERMS.TENANT_CREATE),
  RobustRunner(createTenant)
);

router.post(
  "/register-tenant",
  environmentGuard(Mode.Dev),
  body("name").notEmpty().trim(),
  body("phoneNo").isString().notEmpty(),
  body("email").notEmpty().isEmail().withMessage("invalid Email."),
  body("contactPerson").notEmpty().trim(),
  body("registrationNumber").notEmpty().isNumeric().toInt(),
  body("officialWebsite").optional().notEmpty().trim(), // Is not present when done by new tenant user
  body("gstNumber").notEmpty().isNumeric().toInt(),
  body("billingAddressLine1").notEmpty().trim(),
  body("billingAddressLine2").optional().notEmpty().trim(),
  body("billingCity").notEmpty().trim(),
  body("billingDistrict").notEmpty().trim(),
  body("billingState").notEmpty().trim(),
  body("billingPin").notEmpty().isPostalCode("IN"),
  body("avatar").optional().notEmpty().trim(),
  body("password").notEmpty().trim(),
  body("package").optional({ checkFalsy: true }).notEmpty().isMongoId(), // If done from super-admin side, it will be present; if done by new tenant user then it wont
  validator,
  RobustRunner(createTenantPublicApi)
);

router.post(
  "/verify-tenant",
  environmentGuard(Mode.Dev),
  body("email").notEmpty().isEmail().withMessage("invalid Email."),
  body("verificationCode")
    .notEmpty()
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .toInt(),
  validator,
  RobustRunner(verifyTenant)
);

router.post(
  "/resend-verification-code",
  environmentGuard(Mode.Dev),
  body("email").notEmpty().isEmail().withMessage("invalid Email."),
  RobustRunner(resendVerificationCode)
);

router.get("/fetch-active-package-public", PermissionGuard(PERMS.PACKAGE_LIST), RobustRunner(fetchActivePackages));

//+++++++++++++++++++++++++ fetch all tenants+++++++++++++++++++++++
router.get(
  "/fetchall",
  isAuthenticated,
  PermissionGuard(PERMS.TENANT_LIST),
  RobustRunner(fetchAllTenants)
);

//+++++++++++++++++++++++++ Add initial package by admin +++++++++++++++++++++
router.post(
  "/add-initial-package",
  isAuthenticated,
  body("tenantId").notEmpty().isMongoId(),
  body("packageId").notEmpty().isMongoId(),
  validator,
  PermissionGuard(PERMS.TENANT_UPDATE),
  RobustRunner(addInitialPackageByAdmin)
);

router.patch(
  "/edit-tenant",
  isAuthenticated,
  body("tenantId").notEmpty().isMongoId(),
  body("name").optional().notEmpty().trim(),
  body("phoneNo").optional().isString().notEmpty(),
  body("email").optional().notEmpty().isEmail().withMessage("invalid Email."),
  body("activePackage").optional().notEmpty().isMongoId(),
  body("contactPerson").optional().notEmpty().trim(),
  body("registrationNumber").optional().notEmpty().isNumeric().toInt(),
  body("officialWebsite").optional().notEmpty().trim(),
  body("gstNumber").optional().notEmpty().isNumeric().toInt(),
  body("billingAddressLine1").optional().notEmpty().trim(),
  body("billingAddressLine2").optional().notEmpty().trim(),
  body("billingCity").optional().notEmpty().trim(),
  body("billingDistrict").optional().notEmpty().trim(),
  body("billingState").optional().notEmpty().trim(),
  body("billingPin").optional().notEmpty().isPostalCode("IN"),
  body("avatar").optional().notEmpty().trim(),
  validator,
  PermissionGuard(PERMS.TENANT_UPDATE),
  RobustRunner(editTenantForId)
);

//++++++++++++++++++++++++ Fetch tenant details+++++++++++++++++++++++++++++++
router.post(
  "/fetch-tenant-details",
  isAuthenticated,
  body("tenantId").notEmpty().isMongoId(),
  validator,
  PermissionGuard(PERMS.TENANT_LIST),
  RobustRunner(fetchTenantDetails)
);

router.patch(
  "/add-all-count-to-tenant",
  isAuthenticated,
  PermissionGuard(PERMS.TENANT_UPDATE),
  RobustRunner(addAllCountToTenant)
);
router.post(
  "/add-actualSize-to-tenant",
  isAuthenticated,
  body("tenantId").notEmpty().isMongoId(),
  PermissionGuard(PERMS.TENANT_UPDATE),
  RobustRunner(addActualSizeToTenant)
);
router.delete(
  "/delete-tenant",
  isAuthenticated,
  body("tenantId").notEmpty().isMongoId(),
  validator,
  PermissionGuard(PERMS.TENANT_DELETE, PERMS.TENANT_UPDATE),
  RobustRunner(deleteTenantForId)
);
router.get("/get-tenant-stats", isAuthenticated, PermissionGuard(PERMS.MISSION_LIST), RobustRunner(getTenantStats));
router.patch(
  "/updatepublicMapRef",
  isAuthenticated,
  PermissionGuard(PERMS.TENANT_UPDATE),
  RobustRunner(tenantpublicmaprefupdate)
);

export default router;
