import { Router } from "express";
import { body, query } from "express-validator";
import { RobustRunner, validator } from "../../utils/requestHelpers";
import { isAuthenticated } from "../../utils/authUtils";
import { createThermalPoint, deleteAllThermalPointsForImage, deleteThermalPoint, fetchAllThermalPointsForImage, fetchThermalPoint, genThermal } from "../../controllers/v1/dataController";

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
  "/thermalpoint/create",
  body("posX").notEmpty().isNumeric(),
  body("posY").notEmpty().isNumeric(),
  body("temperature").notEmpty().isNumeric(),
  body("color").notEmpty().isString().matches(/#(([0-9a-f]{6})|([0-9A-F]{6}))/),
  body("documentId").notEmpty().isMongoId(),
  validator,
  isAuthenticated,
  RobustRunner(createThermalPoint),
);

dataRouter.get(
  "/thermalpoint/get",
  query("posX").notEmpty().isNumeric(),
  query("posY").notEmpty().isNumeric(),
  query("documentId").notEmpty().isMongoId(),
  validator,
  isAuthenticated,
  RobustRunner(fetchThermalPoint),
);

dataRouter.delete(
  "/thermalpoint/delete",
  body("posX").notEmpty().isNumeric(),
  body("posY").notEmpty().isNumeric(),
  body("documentId").notEmpty().isMongoId(),
  validator,
  isAuthenticated,
  RobustRunner(deleteThermalPoint),
);

dataRouter.get(
  "/thermalpoint/getall",
  query("documentId").notEmpty().isMongoId(),
  validator,
  isAuthenticated,
  RobustRunner(fetchAllThermalPointsForImage)
);

dataRouter.delete(
  "/thermalpoint/deleteall",
  body("documentId").notEmpty().isMongoId(),
  validator,
  isAuthenticated,
  RobustRunner(deleteAllThermalPointsForImage),
);

export default dataRouter;
