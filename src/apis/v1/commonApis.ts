import express from "express";
import { body } from "express-validator";

import {
  checkIfEmailIdIsAvailable,
  createUploadUrl,
} from "../../controllers/v1/commonController";
import { isAuthenticated } from "../../utils/authUtils";
import { RobustRunner, validator } from "../../utils/requestHelpers";

const router = express.Router();

//++++++++++++++++++++ check if email id is available Api++++++++++++++++++++++++
router.post(
  "/check-email-available",
  isAuthenticated,
  body("email").isEmail().withMessage("invalid Email."),
  validator,
  RobustRunner(checkIfEmailIdIsAvailable),
);

router.post(
  "/upload-url",
  isAuthenticated,
  body("name").isString(),
  body("size").isInt({ min: 1 }).withMessage("file size in bytes"),
  body("type").default("application/octet-stream").isMimeType(),
  body("model").isString(),
  validator,
  RobustRunner(createUploadUrl),
);

export default router;
