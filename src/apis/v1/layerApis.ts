import express, { Request } from "express";
import {
  canaddFeature,
  canCreateLayer,
  canCreateVectorLayer,
  canDeleteFeature,
  candeleteFilefromGEOJSON,
  canDeleteLayer,
  canDownloadLayer,
  caneditGEOJSON,
  canEditLayer,
  canUploadFiletoGEOJSON,
  canSetCoverPhoto,
  isAuthenticated,
  canAutoAssignImage,
} from "../../utils/authUtils";
const router = express.Router();
import multer from "multer";
import {
  createLayer,
  updateLayer,
  deleteLayer,
  getbymissionID,
  getrasterdetailsbyID,
  changecolorbyID,
  downloadassetbyID,
  editGeoJson,
  deleteGeoJson,
  uploadmultiplefile,
  addFeature,
  createVectorLayer,
  sortallLayer,
  filterLayer,
  getFeatureByLayerId,
  uploadfiletoLayer,
  deleteimagesfromgeojson,
  getFeatureCsvByLayerIdx,
  getfilesbylayerIdandfIndex,
  setCoverPhotoByLayerFiles,
  autoAssignImage,
  imageReviewforLayerFileId,
  assignlayerLabel,
  zipbymissionId,
  unreviewedLayerfiles,
  downloadassetbyIDtoKml,
  deleteMultipleLayers,
  gen2x,
  addIsReviewToLayerFiles,
  picktoMapUseForLayerCreate,
  deleteMultipleLayersFiles,
  sys_id_Inject,
  sys_id_Inject_to_layerfiles,
  flagFeature,
  flagLayer,
  publicLayerByMissionId,
} from "../../controllers/v1/layerController";
import { isLayerCount } from "../../utils/countPermission";
import { isSize } from "../../utils/sizePermission";
import { body, oneOf, query, param } from "express-validator";
import {
  requestTimeout,
  validator,
  RobustRunner,
} from "../../utils/requestHelpers";
import { Directory } from "../../constants";
import { multerStorage } from "../../utils/fileUploadUtils";

const upload = multer({
  storage: multerStorage((req: Request): Directory => {
    if (req.params.type == "Vector") return Directory.VECTOR;
    else if (req.params.type == "Raster") return Directory.RASTER;
    else return Directory.GEOJSON_IMAGES;
  }),
});

const uploadlayerfile = multer({
  storage: multerStorage(Directory.LAYER_FILES),
});

// ********* create ***********
router.post(
  "/create/:type",
  isAuthenticated,
  requestTimeout(60_000),
  upload.single("file"),
  body("name").notEmpty().trim(),
  // REGEX
  body("type")
    .notEmpty()
    .trim()
    .matches(/(Vector|Raster)/),
  oneOf([
    body("vector").notEmpty().isMongoId(),
    body("raster").notEmpty().isMongoId(),
  ]),
  //adding date format
  body("captureDate").exists().isISO8601().toDate(), // yyyy-mm-ddThh:mm:ss.sss+hh:mm
  body("missionId").notEmpty().isMongoId(),
  body("layerGroupId").optional().notEmpty().isMongoId(), // layerGroupId may be null/undefined
  // REGEX
  body("color")
    .notEmpty()
    .trim()
    .matches(/#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})/), // hex codes of color, ex: "#FFFFFF" or "#FFF"
  body("icon").optional().notEmpty().trim(), // example: MarkerIcon
  body("inHeritOriginalColorFromFile").optional().notEmpty().trim().isBoolean(),
  validator,
  canCreateLayer,
  isLayerCount,
  isSize,
  RobustRunner(createLayer)
);

//********* upload file to layer************
router.post(
  "/upload-file-to-layer",
  isAuthenticated,
  uploadlayerfile.single("file"),
  body("layerId").notEmpty().isMongoId(),
  validator,
  RobustRunner(uploadfiletoLayer)
);

//**********delete file from geojson feature**********
router.delete(
  "/delete-file-geojson",
  isAuthenticated,
  query("id").notEmpty().isMongoId(),
  validator,
  candeleteFilefromGEOJSON,
  RobustRunner(deleteimagesfromgeojson)
);

// ********* update Layer Info  *************
router.patch(
  "/edit-layer",
  isAuthenticated,
  query("id").notEmpty().isMongoId(),
  body("name").notEmpty().trim(),
  //adding date format
  body("captureDate").exists().isISO8601().toDate(), // yyyy-mm-ddThh:mm:ss.sss+hh:mm
  validator,
  canEditLayer,
  RobustRunner(updateLayer)
);

// ********* update  geojson object*************
router.patch(
  "/edit-geojson",
  isAuthenticated,
  body("id").notEmpty().isMongoId(),
  body("featureIndex").exists().isNumeric().toInt(),
  body("feature").exists().isObject(),
  validator,
  caneditGEOJSON,
  RobustRunner(editGeoJson)
);

// ********* add feature to geojson object*************
router.patch(
  "/addFeature",
  isAuthenticated,
  body("id").notEmpty().isMongoId(),
  body("feature").exists().isObject(),
  validator,
  canaddFeature,
  RobustRunner(addFeature)
);

// ********* upload file in geojson object*************
// TODO: Fails centerPoints validation, even when { "lat": 22, "long": 23 } is passed into centerPoints
// Also dependant on sys_id property
router.patch(
  "/upload-file-geojson",
  isAuthenticated,
  upload.single("file"),
  // req.body is of type layerFile, schema in schemas/layerFile.ts
  body("layerId").notEmpty().isMongoId(),
  body("sys_Id").notEmpty().isString(),
  body("type").notEmpty().trim(), // like: image/jpeg
  body("featureLabel").notEmpty().trim(), // is a number in string format, like "32"
  body("centerPoints")
    .isObject()
    .custom((val) => val.lat && val.lng),
  validator,
  canUploadFiletoGEOJSON,
  isSize,
  RobustRunner(uploadmultiplefile)
);

//************Fetch files for a layer with index */
// TODO: Dependant on sys_id property
router.get(
  "/get-files-by-layerId-fIndex",
  isAuthenticated,
  query("layerId").notEmpty().isMongoId(), // layerId in layerFiles
  // TODO: This might be related to the missing sys_ids
  query("sys_id").optional().notEmpty().isString(), // sys_id is compulsory; and it can be anything (any number or string)
  validator,
  RobustRunner(getfilesbylayerIdandfIndex)
);

// ********* delete  Layer*************s
router.delete(
  "/delete",
  isAuthenticated,
  query("id").notEmpty().isMongoId(),
  validator,
  canDeleteLayer,
  RobustRunner(deleteLayer)
);

// ********* delete  Layer*************s
router.post(
  "/delete-layers",
  isAuthenticated,
  body("layers").notEmpty().isArray({ min: 1 }),
  validator,
  canDeleteLayer,
  RobustRunner(deleteMultipleLayers)
);

// ********* delete geojson object*************
router.delete(
  "/delete-geojson",
  isAuthenticated,
  body("id").notEmpty().isMongoId(),
  body("featureIndex").exists().isNumeric().toInt(),
  validator,
  canDeleteFeature,
  RobustRunner(deleteGeoJson)
);

// ********* fetch layer by missionID  *************
router.get(
  "/getbymissionId",
  isAuthenticated,
  query("missionId").notEmpty().isMongoId(),
  validator,
  RobustRunner(getbymissionID)
);

// ********* fetch raster details layer by layerID *************
router.get(
  "/getrasterdetailsbyID",
  isAuthenticated,
  query("id").notEmpty().isMongoId(),
  validator,
  RobustRunner(getrasterdetailsbyID)
);

// ********* modify color of a layer by layerID *************
router.patch(
  "/changecolorbyId",
  isAuthenticated,
  body("id").notEmpty().isMongoId(),
  // REGEX
  body("color")
    .notEmpty()
    .trim()
    .matches(/#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})/), // hex codes of color, ex: "#FFFFFF" or "#FFF"
  body("icon").optional().notEmpty().trim(), // example: MarkerIcon
  validator,
  canEditLayer,
  RobustRunner(changecolorbyID)
);

// ********* download asset of a layer by layerID *************
// TODO: Works with 200 status, but the link generated is empty string (test written)
router.get(
  "/downloadassetbylayerId",
  isAuthenticated,
  query("id").notEmpty().isMongoId(),
  validator,
  canDownloadLayer,
  RobustRunner(downloadassetbyID)
);

// ********* Create Vector Layer *************
router.post(
  "/create-vector-layer",
  isAuthenticated,
  body("name").notEmpty().trim(),
  body("missionId").notEmpty().isMongoId(),
  body("vectorId").notEmpty().isMongoId(),
  body("geoJSON").exists().isObject(), // use sample geojson made in baselayer tests for testing this too
  validator,
  canCreateVectorLayer,
  isLayerCount,
  RobustRunner(createVectorLayer)
);

// ********* Sort by createdAt or captureDate or name
router.get(
  "/sort-all-layer",
  isAuthenticated,
  oneOf([
    // all three below are sorting orders; can be either asec or desc
    query("name").notEmpty().trim(),
    query("createdAt").notEmpty().trim(),
    query("captureDate").notEmpty().trim(),
  ]),
  query("missionId").notEmpty().isMongoId(),
  validator,
  RobustRunner(sortallLayer)
);

// ********* Filter layers
// TODO: Works but I don't understand the last 4 filtering options (string or boolean) (test written)
router.post(
  "/filter-layer",
  isAuthenticated,
  // required properties
  body("time").optional().trim(), // example: "2 days"
  body("missionId").notEmpty().isMongoId(),
  // optional sorting options
  body("createdAt").optional().notEmpty().trim(), // asce or desc
  body("name").optional().notEmpty().trim(), // asce or desc
  body("captureDate").optional().notEmpty().trim(), // asce or desc
  // optional filtering options
  body("type").optional().notEmpty().isArray({ min: 1 }),
  body("vectorPropsType").optional().notEmpty(), // might be boolean, not sure
  body("vectorProps").optional().notEmpty(), // might be boolean, not sure
  body("rasterProps").optional().notEmpty(), // might be boolean, not sure
  validator,
  RobustRunner(filterLayer)
);

// ********* get features pf geojson ny page,limit and exact search
// TODO: Works, but I dont understand the pagination logic in the controller (test written)
// [ (page*limit) + limit < ar.length, say page is 1 limit is 1, addition becomes 2, but here we need 1 data only right, not 2 ]
router.patch(
  "/get-feature-by-layerId",
  isAuthenticated,
  body("id").notEmpty().isMongoId(),
  body("limit").default(10).isNumeric().toInt(), // defaults to 10
  body("page").default(0).isNumeric().toInt(),
  body("key").optional().notEmpty().trim(), // property key in feature in geojson
  body("value").optional().notEmpty().trim(),
  body("range").optional().isArray({ min: 2, max: 2 }),
  body("isFlagged").optional().isBoolean(),
  validator,
  RobustRunner(getFeatureByLayerId)
);

//**************** Set cover photo */
// TODO: Dependant on sys_id property
router.post(
  "/set-cover-photo-by-layerFiles-Id",
  isAuthenticated,
  body("id").notEmpty().isMongoId(), // id of layerfile
  body("layerId").notEmpty().isMongoId(),
  body("sys_id").notEmpty().isMongoId(),
  body("coverPhoto").exists().isBoolean(),
  validator,
  canSetCoverPhoto,
  RobustRunner(setCoverPhotoByLayerFiles)
);

//**************Generate CSV for all features or selected features for a layer */
router.patch(
  "/get-feature-csv-by-layerIndex",
  isAuthenticated,
  body("featureIndex").notEmpty().isArray({ min: 1 }),
  body("id").notEmpty().isMongoId(),
  validator,
  RobustRunner(getFeatureCsvByLayerIdx)
);

//********************Auto assign pictures to features */
router.patch(
  "/auto-assign-uploaded-image",
  isAuthenticated,
  upload.array("file"), // array of files
  body("radius").optional().isNumeric(),
  body("Id").notEmpty().isMongoId(),
  validator,
  canAutoAssignImage,
  isSize,
  RobustRunner(autoAssignImage)
);

//**************Assign layer Label */
router.patch(
  "/assignLayerLabel",
  isAuthenticated,
  body("layerId").notEmpty().isMongoId(),
  body("label").notEmpty().trim(),
  validator,
  RobustRunner(assignlayerLabel)
);

router.patch(
  "/images-review",
  isAuthenticated,
  body("layerId").notEmpty().isMongoId(),
  body("check").exists().isArray({ min: 1 }),
  validator,
  RobustRunner(imageReviewforLayerFileId)
);

router.get(
  "/fetch-to-be-reviwed-files",
  isAuthenticated,
  query("layerId").notEmpty().isMongoId(),
  validator,
  RobustRunner(unreviewedLayerfiles)
);

router.get(
  "/all-layers-for-mission",
  isAuthenticated,
  query("missionId").notEmpty().isMongoId(),
  validator,
  RobustRunner(zipbymissionId)
);

router.get(
  "/download-asset-by-Id-to-kml",
  isAuthenticated,
  query("id").notEmpty().isMongoId(),
  validator,
  RobustRunner(downloadassetbyIDtoKml)
);

router.patch("/gen_2x_layerfiles", isAuthenticated, RobustRunner(gen2x));
router.patch(
  "/add-isReview-to-layerFiles",
  isAuthenticated,
  RobustRunner(addIsReviewToLayerFiles)
);
// TODO: How to pass array of files
router.post(
  "/pick-to-map-for-layer",
  isAuthenticated,
  upload.array("file", 50),
  body("name").trim(),
  body("vectorId").isMongoId(),
  // optional
  body("color").optional().trim(),
  body("icon").optional().trim(),
  body("type").optional().trim(),
  body("missionId").optional().isMongoId(),
  validator,
  canAutoAssignImage,
  RobustRunner(picktoMapUseForLayerCreate)
);

router.delete(
  "/delete-multipleLayerFiles",
  isAuthenticated,
  body("layerFileIds").notEmpty().isArray({ min: 1 }),
  validator,
  RobustRunner(deleteMultipleLayersFiles)
);

router.patch("/inject_sysId", isAuthenticated, RobustRunner(sys_id_Inject));

router.patch(
  "/inject_sysId_layerfiles",
  isAuthenticated,
  query("layerId").notEmpty().isMongoId(),
  RobustRunner(sys_id_Inject_to_layerfiles)
);

router.patch(
  "/flag-feature/:layerID",
  isAuthenticated,
  param("layerID").isMongoId(),
  body("featureIndex").notEmpty().isArray({ min: 1 }),
  body("flag").isBoolean().toBoolean(),
  validator,
  RobustRunner(flagFeature)
);
router.patch(
  "/flag-layer/:layerID",
  isAuthenticated,
  param("layerID").isMongoId(),
  body("flag").isBoolean().toBoolean(),
  validator,
  RobustRunner(flagLayer)
);
router.get("/layers-by-missionId/:missionId", param("missionId"), validator, RobustRunner(publicLayerByMissionId));
export default router;
