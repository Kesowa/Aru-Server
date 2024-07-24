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
  // isBaseupdateDev,
  createBaseVectorLayer,
  publishBaseLayer,
  getallpublicbaselayer,
  // isPublicupdateDev,
  publicbaselayerSearch,
  GetAlertLocationGeojson,
  GetVideoLocationGeojson,
  // sys_id_Inject
} from "../../controllers/v1/baseLayerController";
import { isAuthenticated, PermissionGuard, } from "../../utils/authUtils";
import multer from "multer";
import { isSize } from "../../utils/sizePermission";
import { isLayerCount } from "../../utils/countPermission";
import { body, query } from "express-validator";
import { validator, RobustRunner } from "../../utils/requestHelpers";
import { Directory } from "../../constants";
import { multerStorage } from "../../utils/fileUploadUtils";
import { PERMS } from "../../schemas/permission";
import { vectorProps } from "../../schemas/vectorprops";
import { rasterProps } from "../../schemas/rasterprops";

const router = express.Router();

const uploadVector = multer({
  storage: multerStorage(Directory.VECTOR),
});
const uploadRaster = multer({
  storage: multerStorage(Directory.RASTER),
});

router.patch(
  "/get-meta-data",
  isAuthenticated,
  body("layers").isArray(),
  validator,
  PermissionGuard(PERMS.LAYER_LIST),
  RobustRunner(getMetadataForBaseLayer)
);

router.post(
  "/create/Vector",
  isAuthenticated,
  uploadVector.single("file"),
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
  PermissionGuard(PERMS.CAN_CREATE_BASE_LAYER),
  isLayerCount,
  isSize,
  RobustRunner(createVectorBaseLayer)
);

router.patch(
  "/get-meta-data-for-update",
  isAuthenticated,
  body("layers").notEmpty().isArray({ min: 1 }),
  body("baseLayer").notEmpty().isMongoId(),
  validator,
  PermissionGuard(PERMS.LAYER_LIST),
  RobustRunner(getMetadataForUpdatingBaseLayer)
);

router.put(
  "/set-prime-attr",
  isAuthenticated,
  body("path").notEmpty(),
  body("pattr").notEmpty().isArray(),
  body("id").notEmpty().isMongoId(),
  validator,
  PermissionGuard(PERMS.CAN_UPDATE_BASE_LAYER),
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
  PermissionGuard(PERMS.CAN_CREATE_BASE_LAYER),
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
  PermissionGuard(PERMS.LAYER_LIST),
  RobustRunner(filterBaseLayer)
);

router.patch(
  "/update-by-layers",
  isAuthenticated,
  body("layers").notEmpty().isArray({ min: 1 }),
  body("baseLayer").notEmpty().isMongoId(),
  validator,
  PermissionGuard(PERMS.CAN_UPDATE_BASE_LAYER),
  RobustRunner(updateBaseLayerByAttr)
);

router.get("/fetch/:type", isAuthenticated, PermissionGuard(PERMS.LAYER_LIST), RobustRunner(getBaseLayers));

router.post(
  "/upload-to-update-base-layer/Vector",
  isAuthenticated,
  uploadVector.single("file"),
  body("baseLayer").notEmpty().isMongoId(),
  validator,
  PermissionGuard(PERMS.CAN_UPLOAD_TO_BASE_LAYER, PERMS.CAN_UPDATE_BASE_LAYER),
  RobustRunner(uploadLayerToUpdateBaseLayer)
);

router.patch(
  "/update-base-layer-by-uploaded-layer",
  isAuthenticated,
  body("filePath").notEmpty(),
  body("baseLayer").notEmpty().isMongoId(),
  body("attrMapping").exists().isObject(),
  validator,
  PermissionGuard(PERMS.CAN_UPLOAD_TO_BASE_LAYER, PERMS.CAN_UPDATE_BASE_LAYER),
  RobustRunner(updateBaseLayerByUploadedFile)
);

router.post(
  "/create-base-raster-import-mission", 
  isAuthenticated,
  body("name").notEmpty().trim(),
  body("layers").notEmpty().isArray({ min: 1 }),
  body("captureDate").exists().isISO8601().toDate(),
  validator,
  PermissionGuard(PERMS.CAN_CREATE_BASE_LAYER),
  RobustRunner(createBaseRasterfromMission)
);

router.delete(
  "/delete-baseLayer-id",
  isAuthenticated,
  body("layers").notEmpty().isArray({ min: 1 }),
  validator,
  PermissionGuard(PERMS.CAN_DELETE_BASE_LAYER),
  RobustRunner(delete_baseLayer)
);

router.post(
  "/create-base-raster-upload/Raster",
  isAuthenticated,
  uploadRaster.single("file"),
  body("name").notEmpty().trim(),
  body("raster")
    .notEmpty()
    .custom((value) =>
      Object.values(rasterProps).includes(value as rasterProps)
    ),
  body("captureDate").exists().isISO8601().toDate(),
  validator,
  PermissionGuard(PERMS.CAN_UPLOAD_TO_BASE_LAYER, PERMS.CAN_UPDATE_BASE_LAYER),
  isLayerCount,
  isSize,
  RobustRunner(createBaseRasterfromUpload)
);


router.patch(
  "/updateRasterLayerUpload/Raster",
  isAuthenticated,
  uploadRaster.single("file"),
  body("layerId").notEmpty().isMongoId(),
  validator,
  PermissionGuard(PERMS.CAN_UPDATE_BASE_LAYER),
  RobustRunner(updateBaseLayerRasterUpload)
);

router.patch(
  "/updateRasterLayerImport",
  isAuthenticated,
  body("layerId").notEmpty().isMongoId(),
  body("layers").notEmpty().isArray({ min: 1 }),
  validator,
  PermissionGuard(PERMS.CAN_UPDATE_BASE_LAYER),
  RobustRunner(updateBaseLayerRasterImport)
);

// router.patch("/updateisBase", isAuthenticated, RobustRunner(isBaseupdateDev));

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
  PermissionGuard(PERMS.CAN_CREATE_BASE_LAYER),
  isLayerCount,
  RobustRunner(createBaseVectorLayer)
);

router.patch(
  "/publishBaseLayer",
  isAuthenticated,
  body("layerId").isMongoId(),
  validator,
  PermissionGuard(PERMS.CAN_UPDATE_BASE_LAYER, PERMS.PUBLIC_MAP_CREATE),
  RobustRunner(publishBaseLayer)
);

router.get(
  "/getallpublicbaselayers",
  query("mapRef").notEmpty(),
  validator,
  RobustRunner(getallpublicbaselayer)
);

// router.patch(
//   "/updateisPublic",
//   isAuthenticated,
//   RobustRunner(isPublicupdateDev)
// );

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
  PermissionGuard(PERMS.ALERT_LIST, PERMS.MISSION_LIST),
  RobustRunner(GetAlertLocationGeojson)
);
router.get(
  "/vods",
  isAuthenticated,
  query("startDate").notEmpty().isISO8601().toDate(),
  query("endDate").notEmpty().isISO8601().toDate(),
  validator,
  PermissionGuard(PERMS.VOD_LIST, PERMS.MISSION_LIST),
  RobustRunner(GetVideoLocationGeojson)
);

export default router;
