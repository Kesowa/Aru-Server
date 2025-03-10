import express from "express";
import rateLimit from "express-rate-limit";
import { body, param } from "express-validator";

import {
  logoutUser,
  loginUser,
  getUserDetails,
  renderResetPasswordPage,
  sendForgotPasswordMail,
  resetPassword,
} from "../../controllers/v1/authController";
import { isAuthenticated, shouldLinkSend } from "../../utils/authUtils";
import { RobustRunner, validator } from "../../utils/requestHelpers";
const router = express.Router();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 50,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

//++++++++++++++++++++ user login Api +++++++++++++++++++++++++++++
router.post(
  "/login",
  body("email").isEmail().withMessage("invalid Email."),
  body("password")
    .isLength({ min: 5 })
    .withMessage("Password must be at least 5 chars long."),
  validator,
  limiter,
  RobustRunner(loginUser)
);

//++++++++++++++++++++ user logout Api +++++++++++++++++++++++++++++
router.post("/logout", RobustRunner(logoutUser));

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
  limiter,
  RobustRunner(resetPassword)
);

router.post(
  "/forgot-password/",
  shouldLinkSend,
  body("email").isEmail().trim(),
  validator,
  RobustRunner(sendForgotPasswordMail)
);

export default router;
