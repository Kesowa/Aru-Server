import { Router } from "express";
import { body, query } from "express-validator";
import { RobustRunner, validator } from "../../utils/requestHelpers";
import { isAuthenticated } from "../../utils/authUtils";
import {
  createThermalTable,
  getThermal,
} from "../../controllers/v1/dataController";

const dataRouter = Router();

dataRouter.get(
  "/thermal",
  query("id").isString().notEmpty(),
  query("doc").isString().notEmpty().isIn(["alert", "document"]),
  validator,
  isAuthenticated,
  RobustRunner(getThermal)
);

dataRouter.post(
  "/thermal/table",
  body("id").isString().notEmpty(),
  body("doc").isString().notEmpty().isIn(["alert", "document"]),
  body("table").isArray().notEmpty(),
  validator,
  isAuthenticated,
  RobustRunner(createThermalTable)
);

export default dataRouter;
