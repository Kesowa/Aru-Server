import express from "express";
import { body } from "express-validator";
import { checkIfEmailIdIsAvailable } from "../../controllers/v1/commonController";
import { isAuthenticated } from "../../utils/authUtils";
import { RobustRunner, validator } from "../../utils/requestHelpers";

const router = express.Router();

//++++++++++++++++++++ check if email id is available Api++++++++++++++++++++++++
router.post(
  "/check-email-available",
  isAuthenticated,
  body("email").isEmail().withMessage("invalid Email."),
  validator,
  RobustRunner(checkIfEmailIdIsAvailable)
);

export default router;
