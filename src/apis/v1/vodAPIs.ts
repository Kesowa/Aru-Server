import express from "express";
import {
  getByFlightOrLocationID,
  getByMissionID,
  saveVOD,
  fetchAllVoddataByLocationId,
  testApiinject,
  saveVODManual,
  removeVOD,
  testApiinjectTenantID,
  renameVOD,
  updateVOD,
  updateMultiVOD,
  removeMultiVOD,
  getCountByMissionID,
  getVODByID,
} from "../../controllers/v1/VODcontroller";
import {
  canCreateVOD,
  canListVOD,
  isAuthenticated,
} from "../../utils/authUtils";
import { isVodCount } from "../../utils/countPermission";
import multer from "multer";
import { isSize } from "../../utils/sizePermission";
import { body, oneOf, query } from "express-validator";
import { RobustRunner, validator } from "../../utils/requestHelpers";
import { Directory } from "../../constants";
import { multerStorage } from "../../utils/fileUploadUtils";

const upload = multer({ storage: multerStorage(Directory.TEMP) });

const router = express.Router();

router.post(
  "/save-VOD",
  body("filename").exists().isString().notEmpty(),
  validator,
  RobustRunner(saveVOD)
);

router.post(
  "/save-vod-manual",
  isAuthenticated,
  upload.single("video"),
  body("locationID").default("5f202f03b9225726102721b8").notEmpty().isMongoId(),
  body("missionID").notEmpty().isMongoId(),
  body("flightID").notEmpty().isMongoId(),
  validator,
  canCreateVOD,
  isVodCount,
  isSize,
  RobustRunner(saveVODManual)
);

//  update data
router.patch(
  "/test-vod-inject",
  isAuthenticated,
  body("limit").exists({ checkFalsy: true }).isNumeric().toInt(),
  body("locationId").notEmpty().isMongoId(),
  body("missionId").notEmpty().isMongoId(),
  body("flightId").notEmpty().isMongoId(),
  validator,
  RobustRunner(testApiinject)
);

router.post(
  "/get-by-ID",
  isAuthenticated,
  body("Id").notEmpty().isArray({ min: 1 }),
  validator,
  RobustRunner(getVODByID)
);

// all get method here
router.get(
  "/get-by-missionID",
  isAuthenticated,
  query("missionID").notEmpty().isMongoId(),
  query("page").default(0).isInt().toInt(),
  // REGEX
  query("sort")
    .optional()
    .isString()
    .notEmpty()
    .trim()
    .matches(/([a-z]+):([a-z]+)/i), // ex: "createdAt:desc"
  query("limit").default(200).isInt({ min: 1, max: 500 }).toInt(),
  query("isFlagged").optional().isBoolean().toBoolean(),
  validator,
  canListVOD,
  RobustRunner(getByMissionID)
);

router.get(
  "/get-count-by-missionID",
  isAuthenticated,
  query("missionID").notEmpty().isMongoId(),
  validator,
  canListVOD,
  RobustRunner(getCountByMissionID)
);

router.get(
  "/get-by-flightID",
  isAuthenticated,
  oneOf([
    [
      query("flightID").notEmpty().isMongoId(),
      query("page").notEmpty().isNumeric().toInt(),
    ],
    query("locationID").notEmpty().isMongoId(),
  ]),
  validator,
  canListVOD,
  RobustRunner(getByFlightOrLocationID)
);

router.get(
  "/get-by-location-ID",
  isAuthenticated,
  query("limit").default(10).isInt({ min: 1, max: 50 }).toInt(),
  query("page").default(1).isInt({ min: 1 }).toInt(),
  query("id").notEmpty().isMongoId(),
  validator,
  canListVOD,
  RobustRunner(fetchAllVoddataByLocationId)
);

router.delete(
  "/delete-by-ID",
  isAuthenticated,
  body("Id").notEmpty().isMongoId(),
  validator,
  RobustRunner(removeVOD)
);

router.delete(
  "/delete-multi-by-ID",
  isAuthenticated,
  body("Id").notEmpty().isArray({ min: 1 }),
  validator,
  RobustRunner(removeMultiVOD)
);

router.patch(
  "/insert-tenantID",
  isAuthenticated,
  body("tenantID").notEmpty().isMongoId(),
  validator,
  RobustRunner(testApiinjectTenantID)
);

router.patch(
  "/edit-by-ID",
  isAuthenticated,
  body("id").notEmpty().isMongoId(),
  body("update").notEmpty().isObject(),
  validator,
  RobustRunner(renameVOD)
);

router.patch(
  "/update-vod-by-ID",
  isAuthenticated,
  body("id").notEmpty().isMongoId(),
  body("update").notEmpty().isObject(),
  validator,
  RobustRunner(updateVOD)
);
router.patch(
  "/update-multi-vod-by-ID",
  isAuthenticated,
  body("Id").notEmpty().isArray({ min: 1 }),
  body("update").notEmpty().isObject(),
  validator,
  RobustRunner(updateMultiVOD)
);

export default router;
