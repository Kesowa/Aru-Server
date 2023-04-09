import express from "express";
import { body, param } from "express-validator";
import { loginUser, getUserDetails } from "../../controllers/v1/authController";
import {
  renderResetPasswordPage,
  sendForgotPasswordMail,
  resetPassword,
} from "../../controllers/v1/authController";
import { isAuthenticated, shouldLinkSend } from "../../utils/authUtils";
import { RobustRunner, validator } from "../../utils/requestHelpers";
const router = express.Router();

//++++++++++++++++++++Health check Api +++++++++++++++++++++++++++

router.get("/health", (req, res) => {
  res.status(200).send("Server is up and running");
});

//++++++++++++++++++++ user login Api +++++++++++++++++++++++++++++
router.post(
  "/login",
  body("email").isEmail().withMessage("invalid Email."),
  body("password")
    .isLength({ min: 5 })
    .withMessage("Password must be at least 5 chars long."),
  validator,
  RobustRunner(loginUser)
);

//++++++++++++++++++++ user user details Api +++++++++++++++++++++++++++++
router.get(
  "/userdetails",
  isAuthenticated,
  validator,
  RobustRunner(getUserDetails)
);

router.get(
  "/reset-password/:token",
  param("token").notEmpty().isString().trim(),
  validator,
  RobustRunner(renderResetPasswordPage)
);

router.post(
  "/reset-password/:token",
  body("password").isString().isLength({ min: 5 }),
  body("password2").isString().isLength({ min: 5 }),
  param("token").notEmpty().isString().trim(),
  validator,
  RobustRunner(resetPassword)
);

router.post(
  "/forgot-password/",
  shouldLinkSend,
  body("email").isEmail().trim().normalizeEmail(),
  validator,
  RobustRunner(sendForgotPasswordMail)
);

export default router;
