import express from "express";
import { isAuthenticated } from "../../utils/authUtils";
const router = express.Router();
import {
  // createVectorProps,
  getAllVectorProps,
} from "../../controllers/v1/vectorPropsController";
// import { body } from "express-validator";
import { RobustRunner } from "../../utils/requestHelpers";

// router.post(
//   "/create",
//   isAuthenticated,
//   body("name").notEmpty().trim(),
//   // REGEX
//   body("type")
//     .notEmpty()
//     .trim()
//     .matches(/(Point|MultiLineString|MultiPolygon)/),
//   validator,
//   RobustRunner(createVectorProps)
// );

// *************get ***********
router.get("/get", isAuthenticated, RobustRunner(getAllVectorProps));

export default router;
