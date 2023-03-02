import express from "express";
import { body } from "express-validator";
import {
  getOrganisationInfo,
  updateOrganisationInfo,
  updateOrganisationEmailGetOTP,
  updateOrganisationEmailResendOTP,
  validateOTPForEmail,
} from "../../controllers/v1/organisationController";
import { isAuthenticated, onlyTenantRootAccess } from "../../utils/authUtils";
import { validator, RobustRunner } from "../../utils/requestHelpers";

const router = express.Router();

//++++++++++++++++++++++++ Fetch tenant details+++++++++++++++++++++++++++++++
router.get(
  "/fetch-organisation-details",
  isAuthenticated,
  onlyTenantRootAccess,
  RobustRunner(getOrganisationInfo)
);

//++++++++++++++++++++ Update Organisation Api +++++++++++++++++++++++++++++
router.post(
  "/update-organisation-details",
  isAuthenticated,
  onlyTenantRootAccess,
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
  RobustRunner(updateOrganisationInfo)
);

//++++++++++++++++++++ request OTP for email updation +++++++++++++++++++++++++++++++
router.post(
  "/request-otp-for-email-change",
  isAuthenticated,
  onlyTenantRootAccess,
  body("email").isEmail().withMessage("invalid Email.").normalizeEmail(),
  validator,
  RobustRunner(updateOrganisationEmailGetOTP)
);

//++++++++++++++++++++ resend OTP email ++++++++++++++++++++++++++++++++++++
router.post(
  "/resend-otp-for-email-change",
  isAuthenticated,
  onlyTenantRootAccess,
  RobustRunner(updateOrganisationEmailResendOTP)
);

//+++++++++++++++++++ validate OTP and update email id++++++++++++++++++++++++
router.post(
  "/validate-otp-update-email",
  isAuthenticated,
  onlyTenantRootAccess,
  body("otp").notEmpty().isNumeric(),
  RobustRunner(validateOTPForEmail)
);

export default router;
