import express from "express";
import { body } from "express-validator";
import {
  getOrganisationInfo,
  updateOrganisationInfo,
  updateOrganisationEmailGetOTP,
  updateOrganisationEmailResendOTP,
  validateOTPForEmail,
} from "../../controllers/v1/organisationController";
import { isAuthenticated, PermissionGuard } from "../../utils/authUtils";
import { validator, RobustRunner } from "../../utils/requestHelpers";
import { PERMS } from "../../schemas/permission";

const router = express.Router();

//++++++++++++++++++++++++ Fetch tenant details+++++++++++++++++++++++++++++++
router.get(
  "/fetch-organisation-details",
  isAuthenticated,
  PermissionGuard(PERMS.TENANT_LIST_SELF),
  RobustRunner(getOrganisationInfo)
);

//++++++++++++++++++++ Update Organisation Api +++++++++++++++++++++++++++++
router.post(
  "/update-organisation-details",
  isAuthenticated,
  body("name").notEmpty().trim(),
  body("contactPerson").notEmpty().trim(),
  body("registrationNumber").notEmpty().isNumeric(),
  body("gstNumber").notEmpty().isNumeric(),
  body("officialWebsite").notEmpty(),
  body("billingAddressLine1").notEmpty(),
  body("billingAddressLine2").notEmpty(),
  body("billingCity").notEmpty().trim(),
  body("billingDistrict").notEmpty().trim(),
  body("billingState").notEmpty().trim(),
  body("billingPin").notEmpty().isPostalCode("IN"),
  body("avatar").optional().notEmpty().trim(),
  validator,
  PermissionGuard(PERMS.TENANT_UPDATE_SELF),
  RobustRunner(updateOrganisationInfo)
);

//++++++++++++++++++++ request OTP for email updation +++++++++++++++++++++++++++++++
router.post(
  "/request-otp-for-email-change",
  isAuthenticated,
  body("email").isEmail().withMessage("invalid Email."),
  validator,
  PermissionGuard(PERMS.TENANT_UPDATE_SELF),
  RobustRunner(updateOrganisationEmailGetOTP)
);

//++++++++++++++++++++ resend OTP email ++++++++++++++++++++++++++++++++++++
router.post(
  "/resend-otp-for-email-change",
  isAuthenticated,
  PermissionGuard(PERMS.TENANT_UPDATE_SELF),
  RobustRunner(updateOrganisationEmailResendOTP)
);

//+++++++++++++++++++ validate OTP and update email id++++++++++++++++++++++++
router.post(
  "/validate-otp-update-email",
  isAuthenticated,
  body("otp").notEmpty().isNumeric(),
  PermissionGuard(PERMS.TENANT_UPDATE_SELF),
  RobustRunner(validateOTPForEmail)
);

export default router;
