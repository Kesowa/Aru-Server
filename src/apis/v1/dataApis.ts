import { Router } from "express";
import { body } from "express-validator";
import { RobustRunner, validator } from "../../utils/requestHelpers";
import { isAuthenticated } from "../../utils/authUtils";
import { genThermal } from "../../controllers/v1/dataController";

const dataRouter = Router();

dataRouter.post(
  "/thermal",
  body("id").isString().notEmpty(),
  body("doc").isString().notEmpty().isIn(["alerts", "documents"]),
  validator,
  isAuthenticated,
  RobustRunner(genThermal),
);

export default dataRouter;
