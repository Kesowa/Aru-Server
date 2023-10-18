import { Router } from "express";
import { body, query } from "express-validator";
import { RobustRunner, validator } from "../../utils/requestHelpers";
import { isAuthenticated } from "../../utils/authUtils";
import {
  createThermalPoint,
  fetchThermalPoint,
  genThermal,
} from "../../controllers/v1/dataController";

const dataRouter = Router();

dataRouter.post(
  "/thermal",
  body("id").isString().notEmpty(),
  body("doc").isString().notEmpty().isIn(["alerts", "documents"]),
  validator,
  isAuthenticated,
  RobustRunner(genThermal)
);

dataRouter.post(
  "/thermal/table",
  body("id").isString().notEmpty(),
  body("doc").isString().notEmpty().isIn(["alerts", "documents"]),
  body("table").isArray().notEmpty(),
  body("label").optional().isString(),
  validator,
  isAuthenticated,
  RobustRunner(createThermalPoint)
);

dataRouter.get(
  "/thermalpoint/table",
  query("id").isString().notEmpty(),
  query("doc").isString().notEmpty().isIn(["alerts", "documents"]),
  validator,
  isAuthenticated,
  RobustRunner(fetchThermalPoint)
);

export default dataRouter;
