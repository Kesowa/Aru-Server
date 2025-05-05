import { Router } from "express";
import { body, query } from "express-validator";

import {
  createThermalTable,
  getThermal,
} from "../../controllers/v1/dataController";
import { isAuthenticated } from "../../utils/authUtils";
import { RobustRunner, validator } from "../../utils/requestHelpers";

const dataRouter = Router();

dataRouter.get(
  "/thermal",
  query("id").isString().notEmpty(),
  query("doc").isString().notEmpty().isIn(["alert", "document"]),
  validator,
  isAuthenticated,
  RobustRunner(getThermal),
);

dataRouter.post(
  "/thermal/table",
  body("id").isString().notEmpty(),
  body("doc").isString().notEmpty().isIn(["alert", "document"]),
  body("table").isArray(), // can be empty, in case user deleted all points and submitted the form
  validator,
  isAuthenticated,
  RobustRunner(createThermalTable),
);

export default dataRouter;
