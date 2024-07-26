import express from "express";
import { body, query } from "express-validator";
import {
  createUser,
  fetchAllUserOfTenant,
  termsAccepted,
  testTerms,
  userCsv,
  UserDelete,
  UserEdit,
} from "../../controllers/v1/userController";
// import { uploadFileforUSer } from "../../controllers/v1/commonController";
import { canListUsers, isAuthenticated } from "../../utils/authUtils";
import { isUserCount } from "../../utils/countPermission";
import { RobustRunner, validator } from "../../utils/requestHelpers";

const router = express.Router();

//++++++++++++++++++++ package poster upload Api++++++++++++++++++++++++
// router.post(
//   "/upload-profile-picture",
//   isAuthenticated,
//   body("avatar").notEmpty().isMongoId(),
//   RobustRunner(uploadFileforUSer)
// );

//++++++++++++++++++++ create user++++++++++++++++++++++++++++++++++
router.post(
  "/create-tenant-user",
  body("email").notEmpty().isEmail().withMessage("invalid Email."),
  body("phoneNo").isString().notEmpty(),
  body("name").notEmpty().trim(),
  body("userGroupId").notEmpty().isMongoId(),
  // REGEX
  body("dob")
    .optional() // frontend has no restrictions for dob, dob is optional in user creation form on frontend
    .notEmpty()
    .isISO8601()
    .toDate(), // yyyy-mm-ddThh:mm:ss.sss+hh:mm //REVISIT
  body("aadhaarNo").optional().notEmpty().isNumeric(), // aadharNo is optional in user creation form on frontend
  body("pilotLicenceNo").optional().notEmpty().isNumeric(), // pilotLicenceNo is optional in user creation form on frontend
  body("avatar").optional().notEmpty().isMongoId(),
  validator,
  isAuthenticated,
  isUserCount,
  RobustRunner(createUser)
);

//+++++++++++++++++++++++++ fetch all user of tenant+++++++++++++++++++++++
router.get(
  "/fetch-all-user",
  isAuthenticated,
  canListUsers,
  RobustRunner(fetchAllUserOfTenant)
);

// TODO: Add other fields as optional to edit-user route. Everything else donee
router.patch(
  "/edit-user",
  isAuthenticated,
  body("id").notEmpty().isMongoId(),
  body("password").optional().notEmpty().isLength({ min: 6 }),
  body("email").optional().notEmpty().isEmail().withMessage("invalid Email."),
  body("phoneNo").optional().isString().notEmpty(),
  body("name").optional().notEmpty().trim(),
  body("userGroupId").optional().notEmpty().isMongoId(),
  // REGEX
  body("dob").optional().notEmpty().isISO8601().toDate(), // yyyy-mm-ddThh:mm:ss.sss+hh:mm //REVISIT
  body("aadhaarNo").optional().notEmpty().isNumeric(),
  body("pilotLicenceNo").optional().notEmpty().isNumeric(),
  body("avatar").optional().notEmpty().trim(),
  validator,
  RobustRunner(UserEdit)
);

router.delete(
  "/delete-user",
  isAuthenticated,
  query("id").notEmpty().isMongoId(),
  validator,
  RobustRunner(UserDelete)
);

router.get("/generate-userList-csv", isAuthenticated, RobustRunner(userCsv));

router.patch(
  "/terms-conditions-check",
  isAuthenticated,
  query("terms").notEmpty().isBoolean(),
  validator,
  RobustRunner(termsAccepted)
);

router.post(
  "/terms-insert",
  isAuthenticated,
  query("flag").notEmpty().trim(),
  validator,
  RobustRunner(testTerms)
);

export default router;
