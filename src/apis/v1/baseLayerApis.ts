import express from "express";

import {
  createVectorBaseLayer,
  getMetadataForBaseLayer,
  setPrimeAttributes,
  createBaseLayerByAttr,
  filterBaseLayer,
  getMetadataForUpdatingBaseLayer,
  updateBaseLayerByAttr,
  getBaseLayers,
  uploadLayerToUpdateBaseLayer,
  updateBaseLayerByUploadedFile,
  createBaseRasterfromMission,
  createBaseRasterfromUpload,
  delete_baseLayer,
  updateBaseLayerRasterUpload,
  updateBaseLayerRasterImport,
  isBaseupdateDev,
  createBaseVectorLayer,
  publishBaseLayer,
  getallpublicbaselayer,
  isPublicupdateDev,
  publicbaselayerSearch,
  GetAlertLocationGeojson,
  GetVideoLocationGeojson,
  // sys_id_Inject
} from "../../controllers/v1/baseLayerController";
import {
  isAuthenticated,
  canCreateBaseLayer,
  canUpdateBaseLayer,
  canCreateVectorLayer,
} from "../../utils/authUtils";
import { isLayerCount } from "../../utils/countPermission";
import { body, query } from "express-validator";
import { validator, RobustRunner } from "../../utils/requestHelpers";
import { vectorProps } from "../../schemas/vectorprops";
import { rasterProps } from "../../schemas/rasterprops";

const router = express.Router();

router.patch(
  "/get-meta-data",
  isAuthenticated,
  body("layers").isArray(),
  validator,
  canCreateBaseLayer,
  RobustRunner(getMetadataForBaseLayer)
);

router.post(
  "/create/Vector",
  isAuthenticated,
  body("file").notEmpty().isMongoId(),
  body("name").notEmpty().trim(),
  body("vector")
    .notEmpty()
    .custom((value) =>
      Object.values(vectorProps).includes(value as vectorProps)
    ),
  //adding date format
  body("captureDate").exists().isISO8601().toDate(),
  body("color").trim().default("#000000"),
  body("icon").optional().isString(),
  body("inHeritOriginalColorFromFile").notEmpty().trim(),
  validator,
  canCreateBaseLayer,
  isLayerCount,
  RobustRunner(createVectorBaseLayer)
);

router.patch(
  "/get-meta-data-for-update",
  isAuthenticated,
  body("layers").notEmpty().isArray({ min: 1 }),
  body("baseLayer").notEmpty().isMongoId(),
  validator,
  canUpdateBaseLayer,
  RobustRunner(getMetadataForUpdatingBaseLayer)
);

router.put(
  "/set-prime-attr",
  isAuthenticated,
  body("path").notEmpty(),
  body("pattr").notEmpty().isArray(),
  body("id").notEmpty().isMongoId(),
  validator,
  canCreateBaseLayer,
  RobustRunner(setPrimeAttributes)
);

router.post(
  "/create-by-layers",
  isAuthenticated,
  body("name").notEmpty().trim(),
  body("pattr").optional().isArray(),
  body("layers").notEmpty().isArray({ min: 1 }),
  body("vectorType")
    .notEmpty()
    .custom((value) =>
      Object.values(vectorProps).includes(value as vectorProps)
    ),
  validator,
  canCreateBaseLayer,
  RobustRunner(createBaseLayerByAttr)
);

router.post(
  "/filter-base-layer",
  isAuthenticated,
  // the below three are sorting options
  body("createdAt").optional().notEmpty().isString(), // either asce or desc
  body("name").optional().notEmpty().isString(), // either asce or desc
  body("captureDate").optional().notEmpty().isString(), // either asce or desc
  body("time").notEmpty().isString(), // days or months or weeks or years
  body("rasterProps").optional().isArray({ min: 1 }),
  body("vectorProps").optional().isArray({ min: 1 }),
  body("vectorPropsType").optional().isArray({ min: 1 }),
  validator,
  RobustRunner(filterBaseLayer)
);

router.patch(
  "/update-by-layers",
  isAuthenticated,
  canUpdateBaseLayer,
  body("layers").notEmpty().isArray({ min: 1 }),
  body("baseLayer").notEmpty().isMongoId(),
  validator,
  RobustRunner(updateBaseLayerByAttr)
);

router.get("/fetch/:type", isAuthenticated, RobustRunner(getBaseLayers));

router.post(
  "/upload-to-update-base-layer/Vector",
  isAuthenticated,
  body("file").notEmpty().isMongoId(),
  body("baseLayer").notEmpty().isMongoId(),
  validator,
  canUpdateBaseLayer,
  RobustRunner(uploadLayerToUpdateBaseLayer)
);

router.patch(
  "/update-base-layer-by-uploaded-layer",
  isAuthenticated,
  body("filePath").notEmpty(),
  body("baseLayer").notEmpty().isMongoId(),
  body("attrMapping").exists().isObject(),
  validator,
  canUpdateBaseLayer,
  RobustRunner(updateBaseLayerByUploadedFile)
);

router.post(
  "/create-base-raster-import-mission",
  isAuthenticated,
  body("name").notEmpty().trim(),
  body("layers").notEmpty().isArray({ min: 1 }),
  body("captureDate").exists().isISO8601().toDate(),
  validator,
  canCreateBaseLayer,
  RobustRunner(createBaseRasterfromMission)
);

router.delete(
  "/delete-baseLayer-id",
  isAuthenticated,
  body("layers").notEmpty().isArray({ min: 1 }),
  validator,
  RobustRunner(delete_baseLayer)
);

router.post(
  "/create-base-raster-upload/Raster",
  isAuthenticated,
  body("file").notEmpty().isMongoId(),
  body("name").notEmpty().trim(),
  body("raster")
    .notEmpty()
    .custom((value) =>
      Object.values(rasterProps).includes(value as rasterProps)
    ),
  body("captureDate").exists().isISO8601().toDate(),
  validator,
  canCreateBaseLayer,
  isLayerCount,
  RobustRunner(createBaseRasterfromUpload)
);

router.patch(
  "/updateRasterLayerUpload/Raster",
  isAuthenticated,
  body("file").notEmpty().isMongoId(),
  body("layerId").notEmpty().isMongoId(),
  validator,
  canUpdateBaseLayer,
  RobustRunner(updateBaseLayerRasterUpload)
);

router.patch(
  "/updateRasterLayerImport",
  isAuthenticated,
  canUpdateBaseLayer,
  body("layerId").notEmpty().isMongoId(),
  body("layers").notEmpty().isArray({ min: 1 }),
  validator,
  RobustRunner(updateBaseLayerRasterImport)
);

router.patch("/updateisBase", isAuthenticated, RobustRunner(isBaseupdateDev));

// router.patch('/inject_sysId',isAuthenticated,sys_id_Inject)

// **************** Create base vector layer ********************
router.post(
  "/create-base-vector-layer",
  isAuthenticated,
  body("name").notEmpty().trim(),
  body("vectorType")
    .notEmpty()
    .custom((value) =>
      Object.values(vectorProps).includes(value as vectorProps)
    ),
  body("geoJSON").exists().isObject(),
  validator,
  //not added validation for geoJSON
  canCreateVectorLayer,
  isLayerCount,
  RobustRunner(createBaseVectorLayer)
);

router.patch(
  "/publishBaseLayer",
  isAuthenticated,
  body("layerId").isMongoId(),
  validator,
  RobustRunner(publishBaseLayer)
);

router.get(
  "/getallpublicbaselayers",
  query("mapRef").notEmpty(),
  validator,
  RobustRunner(getallpublicbaselayer)
);

router.patch(
  "/updateisPublic",
  isAuthenticated,
  RobustRunner(isPublicupdateDev)
);

router.get(
  "/searchPublicLayer",
  query("mapRef").notEmpty().trim(),
  query("value").notEmpty().trim(),
  query("key").notEmpty().trim(),
  validator,
  RobustRunner(publicbaselayerSearch)
);

router.get(
  "/alerts",
  isAuthenticated,
  query("startDate").notEmpty().isISO8601().toDate(),
  query("endDate").notEmpty().isISO8601().toDate(),
  validator,
  RobustRunner(GetAlertLocationGeojson)
);
router.get(
  "/vods",
  isAuthenticated,
  query("startDate").notEmpty().isISO8601().toDate(),
  query("endDate").notEmpty().isISO8601().toDate(),
  validator,
  RobustRunner(GetVideoLocationGeojson)
);

export default router;
