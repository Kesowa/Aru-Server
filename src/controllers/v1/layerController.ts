import shp2json from "shpjs";
import type { Request } from "express";
import type { AuthResponse } from "../../utils/interfaceUtils";
import fetch from "node-fetch";
import Layer from "../../models/layer";
import layerFiles from "../../models/layerFiles";
import Tenant from "../../models/tenant";
import { missionSpecificSocket } from "../../socket";
import sharp from "sharp";
import { ObjectId } from "bson";
import ObjectsToCsv from "objects-to-csv";
import Mission from "../../models/mission";
import fs, { promises as Fs } from "fs";
import {
  deleteDirFileUsingName,
  deletePublicFileUsingPath,
} from "../../utils/fileDeleteUtils";
const tj = require("@mapbox/togeojson"),
  DOMParser = require("xmldom").DOMParser;
import tokml from "tokml";
import resizer from "node-image-resizer";
import {
  modGeoJson,
  readGeoJson,
  editGeoJsonForAll,
  deleteGeoJsonFeature,
  featureAddition,
} from "../../utils/geojsonUtils";
import * as turf from "@turf/turf";
import nearestPoint from "@turf/nearest-point";
import type { NearestPoint } from "@turf/nearest-point";
import exifr from "exifr";
import path from "path";
import { subWeeks, subDays, subMonths, subYears } from "date-fns";
import Flight from "../../models/flight";
import archiver from "archiver";
import { isSizeVector } from "../../utils/sizePermission";
import LayerGroup from "../../models/layerGroup";
import type { IVector } from "../../schemas/vectorprops";
import type { IRaster } from "../../schemas/rasterprops";
import type { IPackage } from "../../schemas/package";
import type { ILayerGroup } from "../../schemas/layerGroup";
import {
  Directory,
  DirPath,
  TITILER_SERVER,
  TITILER_STATIC,
} from "../../constants";
import { type HydratedDocument, Types } from "mongoose";
import type { ILayerFile } from "../../schemas/layerFiles";
import {
  checkFileExists,
  createDirIfNotExists,
  getFileSize,
} from "../../utils/fileUtils";
import type { ILayer } from "../../schemas/layer";
import type { ITenant } from "../../schemas/tenant";
import vector from "../../models/vectorprops";
import raster from "../../models/rasterprops";
// ********* create ***********

export const createLayer = async (req: Request, res: AuthResponse) => {
  {
    let layer: HydratedDocument<ILayer>;
    if (req.params.type == "Vector") {
      const fileExt = path.extname(req.file.originalname).slice(1);
      let pathee2: string;
      let filePath: string;
      if (fileExt === "kml") {
        const pathh1 = DirPath(Directory.VECTOR, req.file?.filename);
        const fileData = await fs.promises.readFile(pathh1, "utf8");
        const kml1 = new DOMParser().parseFromString(fileData);
        const converted = tj.kml(kml1, { styles: true });
        pathee2 = pathh1.split(".")[0] + ".geojson";
        filePath = `/vector/${req.file.filename.replace(".kml", ".geojson")}`;
        await fs.promises.writeFile(pathee2, JSON.stringify(converted));
        await fs.promises.unlink(pathh1);
      } else if (fileExt === "shp" || fileExt === "zip") {
        const filename = path.basename(req.file.filename, fileExt);
        const pathh1 = DirPath(Directory.VECTOR, req.file.filename);
        const shpFile = await Fs.readFile(pathh1);
        pathee2 = filename + "geojson";
        filePath = `/${Directory.VECTOR}/${pathee2}`;
        pathee2 = DirPath(Directory.VECTOR, pathee2);
        const geojson = await shp2json(shpFile);
        await Fs.writeFile(pathee2, JSON.stringify(geojson));
      } else if (fileExt === "geojson") {
        filePath = `/${Directory.VECTOR}/${req.file.filename}`;
        pathee2 = req.file.path;
      } else {
        req.log.error({ fileExt }, "unsupported vector format");
        res.status(400).json({
          status: false,
          message: "file format not supported",
        });
        return;
      }
      const dir = pathee2 || req.file.path;
      const {
        name,
        type,
        vector,
        captureDate,
        missionId,
        color,
        layerGroupId,
      } = req.body;

      const geojson = await readGeoJson(dir);
      const fc = geojson.features.length;
      if (geojson == null) {
        return res.json({
          status: false,
          message: "file path not exist! ",
        });
      }
      if (req.body.inHeritOriginalColorFromFile == "false") {
        const modCheck = await modGeoJson(
          req.body.icon,
          req.body.color,
          geojson,
          dir
        );
        if (modCheck == 0) {
          return res.json({
            status: false,
            message: "Color selection error",
          });
        }
        const size = Number(
          (Number(req.file?.size) / (1024 * 1024)).toFixed(5)
        );
        layer = new Layer({
          name,
          type,
          vector,
          color,
          layerpath: filePath,
          fileSize: size,
          featureCount: fc,
          layerGroupId,
          captureDate,
          missionId,
          tenantId: res.locals.user.tenantId,
          createdBy: res.locals.user._id,
          updatedBy: res.locals.user._id,
        });
      } else {
        if (geojson.features[0].properties.color) {
          let flagColor = geojson.features[0].properties.color;
          for (let i = 0; i < geojson.features.length; i++) {
            if (flagColor != geojson.features[i].properties.color) {
              flagColor = "multiColor";
              break;
            }
          }

          await modGeoJson(null, null, geojson, dir);
          const size: number = Number(
            (Number(req.file?.size) / (1024 * 1024)).toFixed(5)
          );
          layer = new Layer({
            name,
            type,
            vector,
            color: flagColor,
            layerpath:
              fileExt == "kml" ? filePath : `/vector/${req.file?.filename}`,
            fileSize: size,
            featureCount: fc,
            layerGroupId,
            captureDate,
            missionId,
            tenantId: res.locals.user.tenantId,
            createdBy: res.locals.user._id,
            updatedBy: res.locals.user._id,
          });
        } else {
          res.json({
            status: false,
            message: "Failed! GEOJSON does not have color",
          });
        }
      }
    } else if (req.params.type == "Raster") {
      const tif_loc = `/raster/${req.file?.filename}`;

      //----------TITILER API HAS CHANGED-------------------
      //  Metadata api has been removed
      // instead there is statistics api and info api
      // let metaDataURL = `http://192.168.8.20:8000/cog/metadata?url=http://localhost:5011${tif_loc}`;
      //let metaDataURL = `http://localhost:8000/cog/metadata?url=http://localhost:5011${tif_loc}`;
      const { name, type, raster, captureDate, missionId, layerGroupId } =
        req.body;
      let minP = 0;
      let maxP = 1;
      let center = { lat: 0, lng: 0 };
      if (type == "DEM") {
        let metaDataURL = `${TITILER_SERVER}/cog/statistics?url=${TITILER_STATIC}${tif_loc}`;
        //let metaDataURL = `http://172.31.6.26:8000/cog/metadata?url=http://localhost:5011${tif_loc}`;
        req.log.info("fetching metadata from titiler");
        let response = await fetch(metaDataURL, {
          method: "GET",
        });
        req.log.info(response), "getResponse data :  ";
        let metadata = await response.json();
        req.log.info(metadata, "get metadata data :  ");
        //-------handle for detail:not found----
        minP = metadata["1"]["min"];
        maxP = metadata["1"]["max"];
        metaDataURL = `${TITILER_SERVER}/cog/info?url=${TITILER_STATIC}${tif_loc}`;
        response = await fetch(metaDataURL, {
          method: "GET",
        });
        metadata = await response.json();
        center = {
          lat: (metadata["bounds"][1] + metadata["bounds"][3]) / 2,
          lng: (metadata["bounds"][0] + metadata["bounds"][2]) / 2,
        };
      }
      const size: number = Number(
        (Number(req.file?.size) / (1024 * 1024)).toFixed(5)
      );
      layer = new Layer({
        name,
        type,
        raster,
        layerpath: `/raster/${req?.file?.filename}`,
        fileSize: size,
        minp: minP,
        maxp: maxP,
        layerGroupId,
        center: center,
        captureDate,
        missionId,
        tenantId: res.locals.user.tenantId,
        createdBy: res.locals.user._id,
        updatedBy: res.locals.user._id,
      });
    } else {
      return res.json({
        status: false,
        message: "wrong input! choose either Raster nor Vector",
      });
    }
    if (layer) {
      const savedDoc = await layer.save();
      const tenant = await Tenant.findOne({
        _id: res.locals.user.tenantId,
      });
      if (savedDoc && tenant.actualLayerCount >= 0) {
        await Tenant.updateOne(
          { _id: res.locals.user.tenantId },
          { $inc: { actualLayerCount: 1 } }
        );
      }
      const layers = await Layer.findOne({ _id: savedDoc._id })
        .populate<{
          tenantId: ITenant;
        }>("tenantId", "name")
        .populate<{ raster: IRaster }>({ path: "raster" })
        .populate<{ vector: IVector }>({ path: "vector" });
      res.status(201).json({
        status: true,
        message: "New Layer Created",
        data: layers,
      });
    }
  }
};

export const updateLayer = async (req: Request, res: AuthResponse) => {
  {
    const doc = await Layer.findOne({
      _id: req.query.id,
      tenantId: res.locals.user.tenantId._id,
    });
    if (doc) {
      doc.name = req.body.name;
      doc.captureDate = req.body.captureDate;

      if(req.body.layerType) {
        if(doc.type === "Vector") { // for Vector: geometry must match
          // edit layer type
          const currentType = await vector.findById(doc.vector);
          const requestedType = await vector.findById(req.body.layerType);
          if(!requestedType) {
            res.status(404).json({
              status: false,
              message: "layer type not found"
            });
            return;
          }
          else if(currentType.type !== requestedType.type) {
            res.status(400).json({
              status: false,
              message: "geometry of previous type doesn't match new type"
            });
            return;
          } else {
            doc.vector = req.body.layerType;
          }
        } else { // for Raster
          const requestedType = await raster.findById(req.body.layerType);
          if(!requestedType) {
            res.status(404).json({
              status: false,
              message: "layer type not found"
            });
            return;
          }
          doc.raster = req.body.layerType;
        }
      }

      const data = await Layer.findOneAndUpdate(
        {
          _id: req.query.id,
          tenantId: res.locals.user.tenantId._id,
        },
        doc,
        {
          new: true,
        }
      );
      res.status(200).json({
        status: true,
        message: "Layer updated successfully",
        data: data,
      });
    } else {
      res.status(404).json({
        status: false,
        message: "layer id doesnt match!! give correct ID ",
      });
    }
  }
};

export const deleteLayer = async (req: Request, res: AuthResponse) => {
  {
    const d = await Layer.findOne({
      _id: req.query.id,
      tenantId: res.locals.user.tenantId._id,
    });
    if (d) {
      if (d.isBase == true) {
        return res.status(200).json({
          status: false,
          message: "Cannot delete layer which is being used by Base Layer",
        });
      } else {
        const conf = await deletePublicFileUsingPath(d.layerpath);
        if (conf) {
          req.log.info("Files deleted");
        } else {
          req.log.warn("Files does not exist");
        }
        const data = await d.delete();
        const tenant = await Tenant.findOne({
          _id: res.locals.user.tenantId,
        });
        if (data && tenant.actualLayerCount) {
          await Tenant.updateOne(
            { _id: res.locals.user.tenantId },
            { $inc: { actualLayerCount: -1 } }
          );
          // tenant.actualLayerCount = Number(tenant.actualLayerCount) - 1;
          // await tenant.save();
        }

        const lg = d.layerGroupId;
        if (lg) {
          await LayerGroup.updateOne(
            { _id: lg, tenantId: res.locals.user.tenantId },
            { $pull: { layers: req.query.id } },
            { useFindAndModify: false }
          );
        }
        const layerFileData = await layerFiles.find({
          layerId: req.query.id,
          tenantId: res.locals.user.tenantId._id,
        });
        if (layerFileData.length) {
          for (let i = 0; i < layerFileData.length; i++) {
            await deletePublicFileUsingPath(layerFileData[i].filePath);
            const fileName = path.parse(layerFileData[i].filePath).base;
            await deleteDirFileUsingName(
              Directory.GEOJSON_IMAGES,
              "1x_" + fileName
            );
            await deleteDirFileUsingName(
              Directory.GEOJSON_IMAGES,
              "2x_" + fileName
            );
          }
          await layerFiles.deleteMany({
            layerId: req.query.id,
            tenantId: res.locals.user.tenantId._id,
          });
        }
        if (data) {
          res.status(200).json({
            status: true,
            message: "Layer successfully deleted",
            data: d,
          });
        }
      }
    } else {
      res.json({
        status: false,
        message: "Layer ID does not match",
      });
    }
  }
};

export const deleteMultipleLayers = async (req: Request, res: AuthResponse) => {
  {
    const layers = req.body.layers;
    for (let i = 0; i < layers.length; i++) {
      const d = await Layer.findOne({
        _id: layers[i],
        tenantId: res.locals.user.tenantId._id,
      });
      if (d) {
        const conf = await deletePublicFileUsingPath(d.layerpath);
        if (conf) {
          req.log.info("Files deleted");
        } else {
          req.log.warn("Files does not exist");
        }
        const data = await d.delete();
        const tenant = await Tenant.findOne({
          _id: res.locals.user.tenantId,
        });
        if (data && tenant.actualLayerCount) {
          await Tenant.updateOne(
            { _id: res.locals.user.tenantId },
            { $inc: { actualLayerCount: -1 } }
          );
          // tenant.actualLayerCount = Number(tenant.actualLayerCount) - 1;
          // await tenant.save();
        }
        const layerFileData = await layerFiles.find({
          layerId: layers[i],
          tenantId: res.locals.user.tenantId._id,
        });
        if (layerFileData.length) {
          for (let j = 0; j < layerFileData.length; j++) {
            await deletePublicFileUsingPath(layerFileData[j].filePath);
            const fileName = path.parse(layerFileData[j].filePath).base;
            await deleteDirFileUsingName(
              Directory.GEOJSON_IMAGES,
              "1x_" + fileName
            );
            await deleteDirFileUsingName(
              Directory.GEOJSON_IMAGES,
              "2x_" + fileName
            );
          }
          await layerFiles.deleteMany({
            layerId: layers[i],
            tenantId: res.locals.user.tenantId._id,
          });
        }
        const lg = d.layerGroupId;
        if (lg) {
          await LayerGroup.updateOne(
            { _id: lg, tenantId: res.locals.user.tenantId },
            { $pull: { layers: layers[i] } },
            { useFindAndModify: false }
          );
        }
      } else {
        req.log.warn("Layer id doesn't match");
      }
    }

    res.status(200).json({
      status: true,
      message: "Layer successfully deleted",
      data: layers,
    });
  }
};

export const addFeature = async (req: Request, res: AuthResponse) => {
  {
    const data = await Layer.findOne({
      _id: req.body.id,
      tenantId: res.locals.user.tenantId._id,
    });
    if (data.type == "Vector") {
      if (data) {
        if (req.body.feature) {
          const docpath = DirPath(Directory.DEFAULT, data.layerpath);
          const geojson = await readGeoJson(docpath);
          if (geojson == null) {
            return res.json({
              status: false,
              message: "file path not exist! ",
            });
          }
          await featureAddition(docpath, req.body, geojson);
          if (data.color != req.body.feature.properties.color) {
            await Layer.updateOne(
              { _id: req.body.id },
              { color: "multiColor" }
            );
          }
          const updatedLayer = await Layer.findOne({
            _id: req.body.id,
            tenantId: res.locals.user.tenantId._id,
          }).populate<{ vector: IVector }>("vector");
          return res.status(200).json({
            status: true,
            data: updatedLayer,
            message: "Successfully added feature",
          });
        }
      }
    } else {
      res.json({
        status: false,
        message: "Layer type is not vector",
      });
    }
  }
};

export const editGeoJson = async (
  req: Request<
    {},
    {},
    {
      id: Types.ObjectId;
      featureIndex: number;
      feature: Object;
    }
  >,
  res: AuthResponse
) => {
  {
    const data = await Layer.findOne({
      _id: req.body.id,
      tenantId: res.locals.user.tenantId._id,
    });
    if (data) {
      if (req.body.feature && String(req.body.featureIndex)) {
        const docpath = DirPath(Directory.DEFAULT, data.layerpath);
        const geojson = await readGeoJson(docpath);
        if (geojson == null) {
          return res.json({
            status: false,
            message: "file path not exist! ",
          });
        }
        await editGeoJsonForAll(docpath, req.body, geojson);
        for (let i = 0; i < geojson.features.length; i++) {
          if (geojson.features[i].properties.color != data.color) {
            const savedDoc = await Layer.findByIdAndUpdate(
              { _id: req.body.id },
              { color: "multiColor" },
              {
                new: true,
                upsert: true,
              }
            ).populate<{ vector: IVector }>("vector");
            return res.status(200).json({
              status: true,
              message: "Successfully edited GEOJSON And multiColor exist!",
              result: savedDoc,
            });
          }
        }
        return res.status(200).json({
          status: true,
          message: "Successfully edited GEOJSON",
          data: data,
        });
      } else {
        return res.json({
          status: false,
          message: "Feature Error",
        });
      }
    } else {
      res.json({
        status: false,
        message: "Layer ID does not match",
      });
    }
  }
};

export const deleteGeoJson = async (
  req: Request<
    {},
    {},
    {
      id: Types.ObjectId;
      featureIndex: number;
    }
  >,
  res: AuthResponse
) => {
  {
    const data = await Layer.findOne({
      _id: req.body.id,
      tenantId: res.locals.user.tenantId._id,
    });
    if (data) {
      if (
        data.flaggedFeatures.includes(req.body.featureIndex) &&
        data.flaggedFeatures.length === 1
      ) {
        await Layer.updateOne(
          {
            tenantId: res.locals.user.tenantId._id,
            _id: req.body.id,
          },
          {
            isFlagged: false,
          }
        );
      }
      const flaggedFeatures = data.flaggedFeatures
        .filter((index) => index != req.body.featureIndex)
        .map((index) => (index > req.body.featureIndex ? index - 1 : index));
      data.flaggedFeatures = flaggedFeatures;
      await data.save();
      const docpath = DirPath(Directory.DEFAULT, data.layerpath);
      const geojson = await readGeoJson(docpath);
      if (geojson == null) {
        return res.json({
          status: false,
          message: "file path not exist! ",
        });
      }
      await deleteGeoJsonFeature(docpath, req.body, geojson);
      return res.status(200).json({
        status: true,
        message: "Feature Deleted successfully",
      });
    } else {
      res.json({
        status: false,
        message: "Layer ID does not match",
      });
    }
  }
};

export const uploadmultiplefile = async (req: Request, res: AuthResponse) => {
  {
    const layerId = req.body.layerId;
    const sys_Id = req.body.sys_Id;
    if (!req.file) {
      throw new Error("no file in request");
    }
    const x1FilePath = DirPath(
      Directory.GEOJSON_IMAGES,
      `1x_${req.file.filename}`
    );
    const x2FilePath = DirPath(
      Directory.GEOJSON_IMAGES,
      `2x_${req.file.filename}`
    );
    if (!(req.body.type == "image/jpeg" || req.body.type == "image/png")) {
      throw new Error("invalid file format");
    }
    // await removeExifData(req.file.path); // REVISIT: this will break image orientation
    await sharp(req.file.path, { failOn: "truncated" })
      .resize(1280, 720, { fit: "inside" })
      .toFile(x2FilePath);

    await sharp(x2FilePath, { failOn: "truncated" })
      .resize(120, 120, { fit: "inside" })
      .toFile(x1FilePath);
    const size: number = Number(
      (Number(req.file.size) / (1024 * 1024)).toFixed(5)
    );
    const featureFile = new layerFiles({
      name: req.file.originalname,
      layerId: layerId,
      filePath: "/images/geojson/" + req.file.filename,
      fileSize: size,
      isReview: true,
      featureLabel: req.body.featureLabel,
      centerPoints: req.body.centerPoints,
      fileType: req.body.type,
      sys_Id: sys_Id,
      tenantId: res.locals.user.tenantId,
      createdBy: res.locals.user._id,
      updatedBy: res.locals.user._id,
    });

    const savedDoc = await featureFile.save();
    const tenant = await Tenant.findOne({ _id: res.locals.user.tenantId });
    if (savedDoc) {
      res.status(201).json({
        status: true,
        message: `File uploaded succefully to layer :${layerId} for feature:${sys_Id}`,
        data: savedDoc,
      });
    } else {
      res.status(400).json({
        status: false,
        message: "File upload failed",
      });
    }
  }
};

export const getbymissionID = async (req: Request, res: AuthResponse) => {
  {
    const id = req.query.missionId as string;
    const mission = await Mission.findOne<{ name: string }>(
      {
        _id: id,
        tenantId: res.locals.user.tenantId._id,
      },
      {
        name: 1,
      }
    );
    const flight = await Flight.findOne<{
      centerPoints: {
        lat: number;
        lng: number;
      };
    }>(
      {
        mission: id,
        tenant: res.locals.user.tenantId._id,
      },
      {
        centerPoints: 1,
      }
    );
    const doc = await Layer.find({
      missionId: id,
      tenantId: res.locals.user.tenantId._id,
    })
      .populate<{ vector: IVector }>("vector")
      .populate<{ raster: IRaster }>("raster")
      .populate<{ layerGroupId: ILayerGroup }>("layerGroupId");
    if (doc.length) {
      if (doc) {
        res.status(200).json({
          status: true,
          message: "Layer fetched successfully",
          data: {
            mission: mission["name"],
            centerPoints: flight.centerPoints,
            layers: doc,
          },
        });
      } else {
        res.status(200).json({
          status: false,
          message: `Layer does not exist for ${id}`,
        });
      }
    } else {
      res.status(200).json({
        status: true,
        message: "No layer exists for mission",
        missionName: mission["name"],
        centerPoints: flight.centerPoints,
      });
    }
  }
};

export const getrasterdetailsbyID = async (req: Request, res: AuthResponse) => {
  {
    const id: any = req.query.id;
    const result = [];
    const doc = await Layer.findOne({
      _id: id,
      tenantId: res.locals.user.tenantId._id,
    });
    if (doc.type == "Raster") {
      const docpath = DirPath(Directory.DEFAULT, doc.layerpath);
      const fname = doc.layerpath.split(/[\\\/]/)[2];
      const size: number = await getFileSize(docpath);
      if (size) {
        result.push({
          _id: doc._id,
          createdBy: doc.createdBy,
          createdAt: doc.createdAt,
          captureDate: doc.captureDate,
          fileName: fname,
          fileSize: size,
        });
      } else {
        res.json({
          status: true,
          message: `File does not exist`,
          data: result,
        });
      }

      if (result) {
        res.json({
          status: true,
          message: `Fetched Raster Details for LayerID : ${id}`,
          data: result,
        });
      } else {
        res.json({
          status: false,
          message: "Could not fetch Raster Details",
        });
      }
    } else {
      res.json({
        status: false,
        message: "Layer type is not raster",
      });
    }
  }
};

export const changecolorbyID = async (req: Request, res: AuthResponse) => {
  {
    const id: any = req.body.id;
    const color: any = req.body.color;
    const icon: any = req.body.icon;
    const doc = await Layer.findById({
      _id: id,
      tenantId: res.locals.user.tenantId._id,
    });
    const docpath = DirPath(Directory.DEFAULT, doc.layerpath);
    const geojson = await readGeoJson(docpath);
    if (geojson == null) {
      return res.json({
        status: false,
        message: "file path not exist! ",
      });
    }
    let modCheck: any;
    modCheck = await modGeoJson(icon, color, geojson, docpath);
    await Layer.updateOne(
      { _id: id },
      { color: req.body.color },
      { new: true }
    );
    const updatedLayer = await Layer.findById({
      _id: id,
      tenantId: res.locals.user.tenantId._id,
    }).populate<{ vector: IVector }>("vector");
    if (modCheck == 1) {
      res.json({
        status: true,
        data: updatedLayer,
      });
    } else {
      res.json({
        status: false,
        message: `Color or icon modification error`,
      });
    }
  }
};

export const downloadassetbyID = async (req: Request, res: AuthResponse) => {
  {
    const id: any = req.query.id;
    const doc = await Layer.findById({
      _id: id,
      tenantId: res.locals.user.tenantId._id,
    });
    const dir = DirPath(Directory.DEFAULT, doc.layerpath);
    if (await checkFileExists(dir)) {
      const downloadlink = dir
        .split(/[\\\/]/)
        .slice(8)
        .join("/");
      res.json({
        status: true,
        message: `Download Link generated for LayerID: ${id}`,
        link: downloadlink,
      });
    } else {
      res.json({
        status: false,
        message: `File does not exist`,
      });
    }
  }
};

export const createVectorLayer = async (req: Request, res: AuthResponse) => {
  {
    const filepath =
      "/vector/" +
      String(Date.now()) +
      "_" +
      String(req.body.name) +
      ".geojson";
    const file = DirPath(Directory.DEFAULT, filepath);
    await fs.promises.writeFile(file, JSON.stringify(req.body.geoJSON));

    const geojson = await readGeoJson(file);
    // let fc: any = geojson.features.length;
    if (geojson == null) {
      return res.json({
        status: false,
        message: "file path not exist! ",
      });
    }

    const modCheck = await modGeoJson(null, null, geojson, file);
    if (modCheck == 0) {
      return res.json({
        status: false,
        message: "Color selection error",
      });
    }

    const color = req.body.geoJSON.features[0].properties.color;
    const size: number = await getFileSize(file);
    const docCount = await Tenant.findOne({
      _id: res.locals.user.tenantId,
    })
      .populate<{ activePackage: IPackage }>("activePackage")
      .lean();

    const ress = await isSizeVector(size, docCount, file);
    if (ress !== true) {
      return res.status(403).json({
        status: false,
        message: "Actual storage exceeded the Limit of Set storage!",
      });
    }
    const vectorLayer = new Layer({
      name: req.body.name,
      type: "Vector",
      vector: req.body.vectorId,
      missionId: req.body.missionId,
      tenantId: res.locals.user.tenantId._id,
      createdBy: res.locals.user._id,
      updatedBy: res.locals.user._id,
      color: color,
      fileSize: size,
      layerpath: filepath,
      captureDate: new Date(),
    });

    if (vectorLayer) {
      const savedDoc = await vectorLayer.save();
      const tenant = await Tenant.findOne({
        _id: res.locals.user.tenantId,
      });
      if (savedDoc && tenant.actualLayerCount >= 0) {
        await Tenant.updateOne(
          { _id: res.locals.user.tenantId },
          { $inc: { actualLayerCount: 1 } }
        );
        // tenant.actualLayerCount = Number(tenant.actualLayerCount) + 1;
        // await tenant.save();
      }
      res.status(201).json({
        status: true,
        message: "Sucessfully created vector layer",
        data: savedDoc,
      });
    } else {
      res.status(201).json({
        status: false,
        message: "Failed to create vector layer",
      });
    }
  }
};

export const sortallLayer = async (req: Request, res: AuthResponse) => {
  {
    if (req.query.createdAt) {
      const createDate = req.query.createdAt;
      const mission = req.query.missionId;
      if (createDate == "asec") {
        const data = await Layer.find({
          missionId: mission,
          tenantId: res.locals.user.tenantId._id,
        }).sort({ createdAt: 1 });
        if (data.length) {
          res.json({
            status: true,
            message: "Data sorted in ascending order for createdAt",
            docs: data,
          });
        } else {
          res.json({
            status: false,
            message: "missionId not match",
          });
        }
      } else {
        const data = await Layer.find({
          missionId: mission,
          tenantId: res.locals.user.tenantId._id,
        }).sort({ createdAt: -1 });
        if (data) {
          res.json({
            status: true,
            message: "Data sorted in descending order for createdAt",
            docs: data,
          });
        } else {
          res.json({
            status: false,
            message: "missionId not match",
          });
        }
      }
    } else if (req.query.captureDate) {
      const capDate = req.query.captureDate;
      const mission = req.query.missionId;
      if (capDate == "asec") {
        const data = await Layer.find({
          missionId: mission,
          tenantId: res.locals.user.tenantId._id,
        }).sort({ captureDate: 1 });
        if (data.length) {
          res.json({
            status: true,
            message: "Data sorted in ascending order for captureDate",
            docs: data,
          });
        } else {
          res.json({
            status: false,
            message: "missionId not match",
          });
        }
      } else {
        const data = await Layer.find({
          missionId: mission,
          tenantId: res.locals.user.tenantId._id,
        }).sort({ captureDate: -1 });
        if (data.length) {
          res.json({
            status: true,
            message: "Data sorted in descending order for captureDate",
            docs: data,
          });
        } else {
          res.json({
            status: false,
            message: "missionId not match",
          });
        }
      }
    } else if (req.query.name) {
      const namee = req.query.name;
      const mission = req.query.missionId;

      if (namee == "asec") {
        const data = await Layer.find({
          missionId: mission,
          tenantId: res.locals.user.tenantId._id,
        }).sort({ name: 1 });
        if (data) {
          res.json({
            status: true,
            message: "Data sorted in ascending order for name",
            docs: data,
          });
        } else {
          res.json({
            status: false,
            message: "Data not found",
          });
        }
      } else {
        const data = await Layer.find({
          missionId: mission,
          tenantId: res.locals.user.tenantId._id,
        }).sort({ name: -1 });
        if (data) {
          res.json({
            status: true,
            message: "Data sorted in descending order for name",
            docs: data,
          });
        } else {
          res.json({
            status: false,
            message: "Data not found",
          });
        }
      }
    } else {
      res.json({
        status: false,
        message: "At least one query is required",
      });
    }
  }
};

type SortOrder = "asc" | "desc";
export const filterLayer = async (
  req: Request<
    {},
    {},
    {
      createdAt?: SortOrder;
      name?: SortOrder;
      captureDate?: SortOrder;
      time?: string;
      rasterProps?: string[];
      vectorProps?: string[];
      vectorPropsType?: string[];
      type?: string[];
      missionId: Types.ObjectId;
    }
  >,
  res: AuthResponse
) => {
  {
    const sort = {
      createdAt: undefined,
      name: undefined,
      captureDate: undefined,
    };
    if (req.body.createdAt) {
      sort.createdAt = req.body.createdAt === "desc" ? -1 : 1;
    } else if (req.body.name) {
      sort.name = req.body.name === "desc" ? -1 : 1;
    } else if (req.body.captureDate) {
      sort.captureDate = req.body.captureDate === "desc" ? -1 : 1;
    } else sort.createdAt = -1;
    const timeStr = String(req.body.time);
    const time = Number(timeStr.split(" ")[0]);
    const timeType = timeStr.split(" ")[1];
    const endTime = new Date();
    let startTime: Date;
    switch (timeType) {
      case "days":
      case "day":
        startTime = subDays(endTime, time);
        break;
      case "weeks":
      case "week":
        startTime = subWeeks(endTime, time);
        break;
      case "months":
      case "month":
        startTime = subMonths(endTime, time);
        break;
      case "years":
      case "year":
        startTime = subYears(endTime, time);
        break;
      default:
        startTime = new Date("2020-01-01");
        break;
    }
    const d = [];
    const match = { name: req.body.rasterProps };
    const match2 = { name: req.body.vectorProps };
    const match3 = { type: req.body.vectorPropsType };

    if (req.body.type) {
      if (
        (req.body.type[0] === "Raster" && req.body.type[1] === "Vector") ||
        (req.body.type[1] === "Raster" && req.body.type[0] === "Vector")
      ) {
        const result = await Layer.find({
          missionId: req.body.missionId,
          createdAt: {
            $gte: startTime,
            $lte: endTime,
          },
        })
          .sort(sort)
          .populate<{ raster: IRaster }>({ path: "raster" })
          .populate<{ vector: IVector }>({ path: "vector" })
          .exec();
        if (!result.length)
          return res.json({
            status: false,
            message: "Data doesn't exist!",
          });
        for (let i = 0; i < result.length; i++) {
          if (result[i].vector || result[i].raster) {
            d.push(result[i]);
          }
        }
      } else {
        if (req.body.type[0] === "Raster") {
          const result = await Layer.find({
            type: req.body.type,
            missionId: req.body.missionId,
            createdAt: {
              $gte: startTime,
              $lte: endTime,
            },
          })
            .sort(sort)
            .populate<{ raster: IRaster }>({ path: "raster" });
          if (!result.length)
            return res.json({
              status: false,
              message: "Data doesn't exist!",
            });
          for (let i = 0; i < result.length; i++) {
            if (result[i].raster) {
              d.push(result[i]);
            }
          }
        } else {
          if (req.body.type[0] === "Vector") {
            const result = await Layer.find({
              type: req.body.type,
              missionId: req.body.missionId,
              createdAt: {
                $gte: startTime,
                $lte: endTime,
              },
            })
              .sort(sort)
              .populate<{ vector: IVector }>({ path: "vector" });
            if (!result.length)
              return res.json({
                status: false,
                message: "Data doesn't exist!",
              });
            for (let i = 0; i < result.length; i++) {
              if (result[i].vector) {
                d.push(result[i]);
              }
            }
          }
        }
      }
    }
    if (
      !req.body.vectorPropsType &&
      !req.body.vectorProps &&
      !req.body.rasterProps &&
      !req.body.type
    ) {
      const result = await Layer.find({
        missionId: req.body.missionId,
        createdAt: {
          $gte: startTime,
          $lte: endTime,
        },
      })
        .sort(sort)
        .populate<{ raster: IRaster }>({ path: "raster" })
        .populate<{ vector: IVector }>({ path: "vector" })
        .exec();
      if (!result.length)
        return res.json({
          status: false,
          message: "Data doesn't exist!",
        });
      for (let i = 0; i < result.length; i++) {
        if (result[i].vector || result[i].raster) {
          d.push(result[i]);
        }
      }
    }
    if (req.body.vectorPropsType) {
      const result = await Layer.find({
        type: "Vector",
        missionId: req.body.missionId,
        createdAt: {
          $gte: startTime,
          $lte: endTime,
        },
      })
        .sort(sort)
        .populate<{ vector: IVector }>({ path: "vector" });
      for (let i = 0; i < result.length; i++) {
        for (let j = 0; j < match3.type.length; j++) {
          if (result[i].vector) {
            if (result[i].vector.type == match3.type[j]) {
              d.push(result[i]);
            }
          }
        }
      }
    }
    if (req.body.vectorProps) {
      const result = await Layer.find({
        type: "Vector",
        missionId: req.body.missionId,
        createdAt: {
          $gte: startTime,
          $lte: endTime,
        },
      })
        .sort(sort)
        .populate<{ vector: IVector }>({ path: "vector" });
      for (let i = 0; i < result.length; i++) {
        for (let j = 0; j < match2.name.length; j++) {
          if (result[i].vector) {
            if (result[i].vector.name == match2.name[j]) {
              d.push(result[i]);
            }
          }
        }
      }
    }
    if (req.body.rasterProps) {
      const result = await Layer.find({
        type: "Raster",
        missionId: req.body.missionId,
        createdAt: {
          $gte: startTime,
          $lte: endTime,
        },
      })
        .sort(sort)
        .populate<{ raster: IRaster }>({ path: "raster" });
      for (let i = 0; i < result.length; i++) {
        for (let j = 0; j < match.name.length; j++) {
          if (result[i].raster) {
            if (result[i].raster.name == match.name[j]) {
              d.push(result[i]);
            }
          }
        }
      }
    }
    if (d.length) {
      return res.json({
        status: true,
        message: "Sucessfully get Vector or Raster data ",
        data: d,
      });
    } else
      return res.json({
        status: false,
        message: " data not match!",
      });
  }
};

export const getFeatureByLayerId = async (req: Request, res: AuthResponse) => {
  {
    const result = await Layer.findOne({
      _id: req.body.id,
      tenantId: res.locals.user.tenantId._id,
    });
    if (result) {
      const docpath = DirPath(Directory.DEFAULT, result.layerpath);
      const geojson = await readGeoJson(docpath);
      if (geojson == null) {
        return res.json({
          status: false,
          message: "file path not exist!",
        });
      }
      const flaggedFeatures =
        result.flaggedFeatures !== undefined ? result.flaggedFeatures : [];
      const filterFlagged = (data) => {
        const isFlagged = req.body.isFlagged;
        if (isFlagged !== undefined && flaggedFeatures.length >= 0) {
          return data.filter((e, idx) => {
            if (isFlagged) {
              return flaggedFeatures.includes(idx);
            } else {
              return !flaggedFeatures.includes(idx);
            }
          });
        } else {
          return data;
        }
      };
      const d: any = [];
      const q: number = req.body.limit ? Number(req.body.limit) : 10;
      const p: number = Number(req.body.page) * q;
      const ar: any = [];
      const fd: any = filterFlagged(geojson.features);
      if (req.body.key && req.body.range) {
        for (let i = 0; i < fd.length; i++) {
          if (
            fd[i].properties[req.body.key] >= req.body.range[0] &&
            fd[i].properties[req.body.key] <= req.body.range[1]
          ) {
            ar.push({ ...fd[i], index: i });
          }
        }
      } else if (req.body.key && req.body.value) {
        const key = String(req.body.key);
        const value = req.body.value;
        let flag = 0;
        for (let i = 0; i < fd.length; i++) {
          const str: any = String(fd[i].properties[key]);
          if (str.length >= value.length) {
            if (str.includes(req.body.value)) {
              ar.push({ ...fd[i], index: i });
              flag = 1;
            }
          }
        }
        if (flag == 0) {
          return res.json({
            status: false,
            message: "No match found",
          });
        }
      } else {
        for (let i = p; i < p + q; i++) {
          if (fd[i]) {
            d.push({ ...fd[i], index: i });
          }
        }
      }
      if (ar.length) {
        if (Number(req.body.page) * Number(q) + Number(q) < ar.length) {
          for (let i = p; i < p + q; i++) {
            d.push(ar[i]);
          }
        } else {
          return res.json({
            status: true,
            message: `Your data must be less than equal to ${
              ar.length - 1
            } and data index should start from 0`,
            data: ar,
            count: ar.length,
            flaggedFeatures: flaggedFeatures,
          });
        }
      }
      return res.json({
        status: true,
        message: "features fetched successfully!",
        count: d.length,
        data: d,
        flaggedFeatures: flaggedFeatures,
      });
    } else
      return res.status(400).json({
        status: false,
        message: "Layer Id does not match! ",
      });
  }
};

function omit(obj: { [x: string]: any }, omitKey: string[]) {
  return Object.keys(obj).reduce((result, key) => {
    if (key !== omitKey[0] && key !== omitKey[1] && key !== omitKey[2]) {
      result[key] = obj[key];
    }
    return result;
  }, {});
}

export const getFeatureCsvByLayerIdx = async (
  req: Request,
  res: AuthResponse
) => {
  {
    const result = await Layer.findOne({
      _id: req.body.id,
      tenantId: res.locals.user.tenantId._id,
    });
    if (result) {
      const docpath = DirPath(Directory.DEFAULT, result.layerpath);
      const geojson = await readGeoJson(docpath);
      if (geojson == null) {
        return res.json({
          status: false,
          message: "file path not exist!",
        });
      }
      const ws = DirPath(Directory.CSV);
      await createDirIfNotExists(ws, req.log);
      const geoArray: any = [];
      const clone: any = [];
      if (req.body.featureIndex) {
        if (req.body.featureIndex.length <= geojson.features.length) {
          for (let i = 0; i < req.body.featureIndex.length; i++) {
            geoArray.push(
              geojson.features[req.body.featureIndex[i]].properties
            );
          }
          for (let j = 0; j < geoArray.length; j++) {
            clone.push(omit(geoArray[j], ["sys_id", "icon", "color"]));
          }
        } else
          return res.json({
            status: false,
            message: ` client requirement geojson features exceeds the exist geojson features count!${geojson.features.length} `,
          });
      } else {
        for (let i = 0; i < geojson.features.length; i++) {
          geoArray.push(geojson.features[i].properties);
        }
        for (let j = 0; j < geoArray.length; j++) {
          clone.push(omit(geoArray[j], ["sys_id", "icon", "color"]));
        }
      }
      const csv = new ObjectsToCsv(clone);
      const filename = Math.floor(Math.random() * 620000);
      const file = path.join(ws, `${filename}.csv`);
      await csv.toDisk(file);
      res.json({
        status: true,
        message: "csv file created successfully!",
        pathh: `/csv/${filename}.csv`,
      });
    } else
      return res.status(400).json({
        status: false,
        message: "Layer Id does not match! ",
      });
  }
};
export const uploadfiletoLayer = async (req: Request, res: AuthResponse) => {
  {
    const fname = req.file?.originalname;
    const fpath = "/layerFiles/" + req.file?.filename;
    const layerId = req.body.layerId;
    const newFilename = `1x_${req.file?.filename}`;
    const newFilename2 = `2x_${req.file?.filename}`;
    if (
      req.file?.mimetype == "image/jpeg" ||
      req.file?.mimetype == "image/png"
    ) {
      sharp(req.file?.path)
        .resize(120, 120, { withoutEnlargement: true })
        .toFile(DirPath(Directory.LAYER_FILES, newFilename))
        .then((result) => {})
        .catch((err) => {
          req.log.error(err);
        });
      sharp(req.file?.path)
        .resize(1280, 720, { withoutEnlargement: true })
        .toFile(DirPath(Directory.LAYER_FILES, newFilename2))
        .then((result) => {})
        .catch((err) => {
          req.log.error(err);
        });
    }
    const size: number = Number(
      (Number(req.file?.size) / (1024 * 1024)).toFixed(5)
    );
    const layerfile = new layerFiles({
      name: fname,
      layerId: layerId,
      filePath: fpath,
      fileSize: size,
      tenantId: res.locals.user.tenantId,
      createdBy: res.locals.user._id,
      updatedBy: res.locals.user._id,
    });
    const savedDoc = await layerfile.save();
    if (savedDoc) {
      res.status(201).json({
        status: true,
        message: `File uploaded succefully to layer :${layerId}`,
        data: savedDoc,
      });
    } else {
      res.status(200).json({
        status: false,
        message: "File upload failed",
      });
    }
  }
};

export const deleteimagesfromgeojson = async (
  req: Request,
  res: AuthResponse
) => {
  {
    const data = await layerFiles.findOne({
      _id: req.query.id,
      tenantId: res.locals.user.tenantId._id,
    });
    if (data) {
      if (data.fileType == "image/jpeg" || data.fileType == "image/png") {
        const fileName = path.parse(data.filePath).base;
        await deleteDirFileUsingName(
          Directory.GEOJSON_IMAGES,
          "1x_" + fileName
        );
        await deleteDirFileUsingName(
          Directory.GEOJSON_IMAGES,
          "2x_" + fileName
        );
      }
      await deletePublicFileUsingPath(data.filePath);
      const d = await data.delete();
      if (d) {
        res.status(200).json({
          status: true,
          message: `File deleted`,
          data: data,
        });
      } else {
        res.status(200).json({
          status: false,
          message: "File delete failed",
        });
      }
    } else {
      res.status(200).json({
        status: false,
        message: "FileId does not exist",
      });
    }
  }
};

export const getfilesbylayerIdandfIndex = async (
  req: Request,
  res: AuthResponse
) => {
  {
    if (req.query.layerId && req.query.sys_id) {
      const data = await layerFiles.find({
        $or: [
          {
            layerId: req.query.layerId,
            sys_Id: req.query.sys_id,
            isReview: true,
            tenantId: res.locals.user.tenantId._id,
          },
          {
            layers: { $in: [req.query.layerId] },
            sys_Id: req.query.sys_id,
            isReview: true,
            tenantId: res.locals.user.tenantId._id,
          },
        ],
      });
      if (data) {
        res.status(200).json({
          status: true,
          message: `Fetched files for LayerId:${req.query.layerId} and sys_id:${req.query.sys_id}`,
          data: data,
        });
      } else {
        res.status(200).json({
          status: false,
          message: "Layer Id and sys_Id does not exist",
        });
      }
    } else if (req.query.sys_id) {
      const data = await layerFiles.find({
        sys_Id: req.query.sys_id,
        isReview: true,
        tenantId: res.locals.user.tenantId._id,
      });
      if (data) {
        res.status(200).json({
          status: true,
          message: `Fetched files for sys_Id:${req.query.sys_id}`,
          data: data,
        });
      } else {
        res.status(400).json({
          status: false,
          message: "Sys_Id does not exist",
        });
      }
    } else {
      const data = await layerFiles.find({
        $or: [
          {
            layerId: req.query.layerId,
            isReview: true,
            tenantId: res.locals.user.tenantId._id,
          },
          {
            layers: { $in: [req.query.layerId] },
            isReview: true,
            tenantId: res.locals.user.tenantId._id,
          },
        ],
      });
      if (data) {
        res.status(200).json({
          status: true,
          message: `Fetched files for LayerId:${req.query.layerId}`,
          data: data,
        });
      } else {
        res.status(400).json({
          status: false,
          message: "Layer Id does not exist",
        });
      }
    }
  }
};

export const setCoverPhotoByLayerFiles = async (
  req: Request,
  res: AuthResponse
) => {
  {
    const resultOne = await layerFiles.updateOne(
      {
        _id: req.body.id,
        layerId: req.body.layerId,
        tenantId: res.locals.user.tenantId,
        sys_Id: req.body.sys_id,
      },
      {
        coverPhoto: req.body.coverPhoto,
      }
    );
    const resultTwo = await layerFiles.updateMany(
      {
        _id: { $ne: req.body.id },
        layerId: req.body.layerId,
        tenantId: res.locals.user.tenantId,
        sys_Id: req.body.sys_id,
      },
      {
        coverPhoto: false,
      }
    );
    if (resultOne && resultTwo) {
      return res.status(200).json({
        status: true,
        message: `coverPhoto successfully updated!`,
      });
    } else
      return res.status(400).json({
        status: false,
        message: `layerID does not match!`,
      });
  }
};

export const autoAssignImage = async (req: Request, res: AuthResponse) => {
  {
    res.status(201).json({
      status: true,
      message: "Auto assignment has been started",
    });
    const layerDoc = await Layer.findOne({
      _id: req.body.Id,
      tenantId: res.locals.user.tenantId,
    });

    if (!layerDoc) throw new Error("layerDoc not found");

    const missionId = layerDoc.missionId;
    if (layerDoc) {
      const docpath = DirPath(Directory.DEFAULT, layerDoc.layerpath);
      const geojson = await readGeoJson(docpath);
      let snapRadius: number = 120; // meters
      if (req.body.radius) {
        const tmpRadius = Number(req.body.radius);
        if (tmpRadius > 0) {
          snapRadius = tmpRadius;
        }
      }
      req.log.info("snapping radius", snapRadius);
      const badImages = [];
      const dataa: Array<ILayerFile> = [];
      // Nearest point finder
      if (geojson) {
        const collection = turf.featureCollection<turf.Point>(
          geojson.features.map(
            (feature: { geometry: { coordinates: turf.helpers.Position } }) =>
              turf.point(feature.geometry.coordinates)
          )
        );
        const files = req.files as Express.Multer.File[];
        for (let j = 0; j < files.length; j++) {
          req.log.info("file number", j);
          let closestPoint: NearestPoint;
          // catch bad image
          try {
            const { latitude, longitude } = await exifr.gps(files[j].path);
            if (latitude == null || longitude == null) {
              throw new Error("invalid coordinates!");
            }
            const imagePoint = turf.point([longitude, latitude]);
            closestPoint = nearestPoint(imagePoint, collection);
            const distance =
              turf.distance(imagePoint, closestPoint, { units: "kilometers" }) *
              1000;
            if (distance > snapRadius) {
              throw new Error("image outside bounds!");
            }
          } catch (err) {
            req.log.error(err);
            badImages.push(files[j].originalname);
            req.log.error("bad image", files[j].originalname);
            continue;
          }
          req.log.info("good image", files[j].originalname);

          // this is the original closest point
          const findex = geojson.features[closestPoint.properties.featureIndex];

          const layerId = req.body.Id;
          const centerPoints2 = {
            lat: String(closestPoint.geometry.coordinates[1]),
            lng: String(closestPoint.geometry.coordinates[0]),
          };
          const fpath = "/images/geojson/" + files[j].filename;
          req.log.info("file path:", fpath);
          const newFilename = `1x_${files[j].filename}`;
          if (
            files[j].mimetype == "image/jpeg" ||
            files[j].mimetype == "image/png"
          ) {
            await sharp(files[j].path)
              .resize(120, 120, { withoutEnlargement: true })
              .toFile(DirPath(Directory.GEOJSON_IMAGES, newFilename))
              .then((result) => {})
              .catch((err) => {
                req.log.error("thumbnail creation failed");
              });
            //? why not created both thumbnails at once
            if (
              await checkFileExists(
                DirPath(Directory.GEOJSON_IMAGES, files[j].filename)
              )
            ) {
              await resizer(
                DirPath(Directory.GEOJSON_IMAGES, files[j].filename),
                {
                  all: {
                    path: DirPath(Directory.GEOJSON_IMAGES),
                    quality: 80,
                  },
                  versions: [
                    {
                      quality: 100,
                      prefix: "2x_",
                      width: 1280,
                      height: 720,
                    },
                  ],
                }
              );
            }
          }
          const size: number = Number(
            (Number(files[j].size) / (1024 * 1024)).toFixed(5)
          );
          req.log.info("file size", size);
          const featureFile = new layerFiles({
            name: files[j].originalname,
            layerId: layerId,
            filePath: fpath,
            fileSize: size,
            //! too complex
            featureLabel: layerDoc.layerLabel
              ? findex.properties[layerDoc.layerLabel]
                ? findex.properties[layerDoc.layerLabel]
                : null
              : null,
            centerPoints: centerPoints2,
            fileType: files[j].mimetype,
            sys_Id: findex.properties.sys_id,
            tenantId: res.locals.user.tenantId,
            createdBy: res.locals.user._id,
            updatedBy: res.locals.user._id,
          });
          const savedDoc = await featureFile.save();
          if (savedDoc) {
            dataa.push(savedDoc);
          }
        }
        const message = {
          layerName: layerDoc.name,
          data: dataa,
          badImages: badImages,
        };
        if (dataa.length > 0) {
          missionSpecificSocket
            .to(missionId.toString())
            .emit("ASSIGNED SUCESSFULLY", message);
          req.log.info("sent");
        } else {
          missionSpecificSocket.to(missionId.toString()).emit("ERR");
        }
      }
    } else {
      res.json({
        status: false,
        message: "Layer ID does not match",
      });
    }
  }
};

export const assignlayerLabel = async (req: Request, res: AuthResponse) => {
  {
    const doc = await Layer.findOne({
      _id: req.body.layerId,
      tenantId: res.locals.user.tenantId._id
        ? res.locals.user.tenantId._id
        : res.locals.user.tenantId,
    });
    if (doc) {
      let savedDoc: any;
      if (req.query.popup) {
        savedDoc = await Layer.updateOne(
          { _id: req.body.layerId },
          { layerPopupLabel: req.body.label }
        );
      } else {
        savedDoc = await Layer.updateOne(
          { _id: req.body.layerId },
          { layerLabel: req.body.label }
        );
      }

      if (savedDoc) {
        const d: any = await Layer.findOne({
          _id: req.body.layerId,
          tenantId: res.locals.user.tenantId._id
            ? res.locals.user.tenantId._id
            : res.locals.user.tenantId,
        })
          .populate<{ vector: IVector }>("vector")
          .populate<{ raster: IRaster }>("raster")
          .populate<{ layerGroupId: ILayerGroup }>("layerGroupId");

        await layerFiles.updateMany(
          {
            $or: [
              {
                layerId: req.body.layerId,
                tenantId: res.locals.user.tenantId._id
                  ? res.locals.user.tenantId._id
                  : res.locals.user.tenantId,
              },
              {
                layers: { $in: [req.body.layerId] },
                tenantId: res.locals.user.tenantId._id
                  ? res.locals.user.tenantId._id
                  : res.locals.user.tenantId,
              },
            ],
          },
          { featureLabel: req.body.label }
        );

        res.status(200).json({
          status: true,
          message: `Layer Label updated`,
          data: d,
        });
      } else
        return res.status(200).json({
          status: false,
          message: `Could not update layer label`,
        });
    } else {
      res.status(200).json({
        status: false,
        message: `Layer does not exist`,
      });
    }
  }
};

export const imageReviewforLayerFileId = async (
  req: Request,
  res: AuthResponse
) => {
  {
    const layerDoc: any = await Layer.findOne({
      _id: req.body.layerId,
      tenantId: res.locals.user.tenantId,
    });
    if (layerDoc) {
      const docpath: any = DirPath(Directory.DEFAULT, layerDoc.layerpath);
      const geojson: any = await readGeoJson(docpath);
      for (let i = 0; i < req.body.check.length; i++) {
        const doc: any = await layerFiles.findOne({
          _id: req.body.check[i]._id,
          tenantId: res.locals.user.tenantId,
        });
        const sys_Id: any = req.body.check[i].sys_Id;
        for (let j = 0; j < geojson.features.length; j++) {
          const today = new Date();
          const time: any =
            today.getHours() +
            ":" +
            today.getMinutes() +
            ":" +
            today.getSeconds();
          req.log.info("Match start time: " + time);
          if (geojson.features[j].properties.sys_id == sys_Id) {
            const centerPoints2 = {
              lat: String(geojson.features[j].geometry.coordinates[1]),
              lng: String(geojson.features[j].geometry.coordinates[0]),
            };
            if (doc) {
              doc.isReview = true;
              if (
                String(doc.sys_Id) !=
                String(req.body.check[i].sys_Id || doc.sys_Id == null)
              ) {
                doc.sys_Id = geojson.features[j].properties.sys_id;
                doc.featureLabel = layerDoc.layerLabel
                  ? geojson.features[j].properties[layerDoc.layerLabel]
                    ? geojson.features[j].properties[layerDoc.layerLabel]
                    : j
                  : j;
                doc.centerPoints = centerPoints2;
              }
              const promise: any = await doc.save();
              if (promise) {
                const time2: any =
                  today.getHours() +
                  ":" +
                  today.getMinutes() +
                  ":" +
                  today.getSeconds();
                req.log.info("Match found time: " + time2);
                const elapsedT: any = time2 - time;
                req.log.info("Elapsed time: " + elapsedT);
              }
            }
            break;
          }
        }
      }
      res.status(200).json({
        status: true,
        message: "Image review successfully completed!",
      });
    } else {
      res.status(200).json({
        status: false,
        message: "Cannot find layer",
      });
    }
  }
};

export const unreviewedLayerfiles = async (req: Request, res: AuthResponse) => {
  {
    const docs = await layerFiles.find({
      layerId: req.query.layerId,
      isReview: false,
      tenantId: res.locals.user.tenantId,
    });
    if (docs.length) {
      return res.status(200).json({
        status: true,
        message: `Sucessfully fetched to be reviwed images for layer: ${req.query.layerId}`,
        data: docs,
      });
    } else
      return res.status(200).json({
        status: false,
        message: `Could not fetch layer files!`,
      });
  }
};

export const zipbymissionId = async (req: Request, res: AuthResponse) => {
  {
    const d = await Layer.find({
      missionId: req.query.missionId,
      tenantId: res.locals.user.tenantId._id,
    });
    const missionId: any = req.query.missionId;
    if (d.length) {
      res.status(200).json({
        status: true,
        message: "Zipping Started",
      });
      missionSpecificSocket.to(missionId).emit("LAYER_ZIP_START");
      const dir = DirPath(Directory.TEMP);
      await createDirIfNotExists(dir, req.log);
      const fname = `${req.query.missionId}_layers_${Date.now()}.zip`;
      const output = fs.createWriteStream(`${dir}${fname}`);
      const archive = archiver("zip", {
        zlib: { level: 9 }, // Sets the compression level.
      });

      archive.pipe(output);

      for (let i = 0; i < d.length; i++) {
        archive.file(DirPath(Directory.DEFAULT, d[i].layerpath), {
          //#typeError
          name: d[i].layerpath.split("/")[2],
        });
      }

      // output.on("close", function () {
      //   req.log.info(archive.pointer() + " total bytes");
      //   req.log.info(
      //     "archiver has been finalized and the output file descriptor has closed.",
      //   );
      // });
      // Error
      try {
        await archive.finalize();
        const link = `temp/${fname}`;
        missionSpecificSocket.to(missionId).emit("LAYER_ZIP_COMPLETED", link);
      } catch (error) {
        req.log.error(error);
        missionSpecificSocket.to(missionId).emit("LAYER_ZIP_FAILED");
      }
    } else {
      res.status(200).json({
        status: false,
        message: "MissionId or Folder name does not match",
      });
    }
  }
};

export const downloadassetbyIDtoKml = async (
  req: Request,
  res: AuthResponse
) => {
  {
    const id: any = req.query.id;
    const doc = await Layer.findById({
      _id: id,
      tenantId: res.locals.user.tenantId._id,
    });
    const dir: string = DirPath(Directory.DEFAULT, doc.layerpath);
    const geojson: any = await fs.promises.readFile(dir, "utf-8");
    const dir2: string = String(dir.replace(".geojson", ".kml"));
    await fs.promises.writeFile(
      dir.replace(".geojson", ".kml"),
      tokml(JSON.parse(geojson))
    );

    const downloadlink = doc.layerpath.replace(".geojson", ".kml");
    res.json({
      status: true,
      message: `Download Link generated for LayerID: ${id}`,
      link: downloadlink,
    });
  }
};

export const gen2x = async (req: Request, res: AuthResponse) => {
  {
    const docs = await layerFiles.find<{ fileType: string; filePath: string }>(
      {
        tenantId: res.locals.user.tenantId,
      },
      {
        fileType: 1,
        filePath: 1,
      }
    );
    if (docs.length) {
      for (let i = 0; i < docs.length; i++) {
        if (docs[i].fileType == "image/jpeg") {
          const newFilename = DirPath(Directory.DEFAULT, docs[i].filePath);
          if (!(await checkFileExists(newFilename))) {
            await resizer(newFilename, {
              all: {
                path: DirPath(Directory.GEOJSON_IMAGES),
                quality: 80,
              },
              versions: [
                {
                  quality: 100,
                  prefix: "2x_",
                  width: 1280,
                  height: 720,
                },
              ],
            });
          }
          // let filename = docs[i].filePath.split('/')[3]
          // let newfileName = `2x_${filename}`
          // sharp(DirPath(Directory.GEOJSON_IMAGES, filename))
          //   .resize(1280, 720, { withoutEnlargement: true })
          //   .toFile(DirPath(Directory.GEOJSON_IMAGES, newfileName))
          //   .then((result) => {
          //   }).catch((err) => {
          //     req.log.error(err)
          //   });
        }
      }
      res.status(200).json({
        status: true,
        message: `Successfully generated 2x files`,
      });
    } else {
      res.status(200).json({
        status: false,
        message: `Oops no layerFiles found`,
      });
    }
  }
};

export const addIsReviewToLayerFiles = async (
  req: Request,
  res: AuthResponse
) => {
  {
    const layerFileDoc = await layerFiles.updateMany(
      {
        tenantId: res.locals.user.tenantId,
      },
      {
        isReview: true,
      }
    );
    if (layerFileDoc) {
      res.status(200).json({
        status: true,
        message: `layerFiles isReview property updated Successfully! `,
      });
    } else {
      res.status(403).json({
        status: false,
        message: `Oops no layerFiles found`,
      });
    }
  }
};

export const deleteMultipleLayersFiles = async (
  req: Request,
  res: AuthResponse
) => {
  {
    const layerFilesQuery = req.body.layerFileIds as string[];
    for (let i = 0; i < layerFilesQuery.length; i++) {
      const layerFileData = await layerFiles.findOne({
        _id: layerFilesQuery[i],
        tenantId: res.locals.user.tenantId,
      });
      if (layerFileData) {
        await deletePublicFileUsingPath(layerFileData.filePath);
        const fileName = path.parse(layerFileData.filePath).base;
        await deleteDirFileUsingName(
          Directory.GEOJSON_IMAGES,
          "1x_" + fileName
        );
        await deleteDirFileUsingName(
          Directory.GEOJSON_IMAGES,
          "2x_" + fileName
        );
        await layerFileData.delete();
      }
    }
    res.status(200).json({
      status: true,
      message: "LayerFiles successfully deleted",
      data: layerFilesQuery,
    });
  }
};

export const picktoMapUseForLayerCreate = async (
  req: Request,
  res: AuthResponse
) => {
  {
    const files = req.files as Express.Multer.File[];
    if (files) {
      const geojson: any = {};
      const features: any = [];
      const allImageData: any = [];
      const badImages: any = [];
      const today = new Date();
      const snapRadius = 60; // meters
      for (let i = 0; i < files.length; i++) {
        const img_path = DirPath(Directory.GEOJSON_IMAGES, files[i]?.filename);
        const ff: any = await exifr.parse(img_path);
        const temp: any = {};
        const geometry: any = {};
        const coordinates: any = [];
        const properties: any = {};
        if (ff) {
          const time: any =
            today.getHours() +
            ":" +
            today.getMinutes() +
            ":" +
            today.getSeconds();
          const date: any =
            today.getFullYear() +
            "-" +
            (today.getMonth() + 1) +
            "-" +
            today.getDate();
          const long: any = ff.longitude ? ff.longitude : 0;
          const lat: any = ff.latitude ? ff.latitude : 0;
          let sys_id = new ObjectId();

          // check if image location already exists
          const imagePoint = turf.point([long, lat]);
          let alreadyRegistered = false;
          for (let j = 0; j < features.length; j++) {
            const featurePoint = turf.point(features[j].geometry.coordinates);
            const distance =
              turf.distance(imagePoint, featurePoint, { units: "kilometers" }) *
              1000;
            if (distance < snapRadius) {
              // if image exists, share sys_id
              sys_id = features[j].properties.sys_id;
              alreadyRegistered = true;
              break;
            }
          }
          allImageData.push({
            filename: files[i]?.filename,
            originalname: files[i]?.originalname,
            sys_id: sys_id,
            mimetype: files[i].mimetype,
            path: img_path,
            coordinates: [long, lat],
          });
          if (alreadyRegistered) {
            continue;
          }
          coordinates.push(long);
          coordinates.push(lat);
          geometry["coordinates"] = coordinates;
          geometry["type"] = "Point";
          properties["id"] = String(i + 1);
          properties["filename"] = files[i]?.filename;
          properties["color"] = req.body.color ? req.body.color : "green";
          properties["icon"] = req.body.icon ? req.body.icon : "MarkerIcon";
          properties["lat"] = String(lat);
          properties["long"] = String(long);
          properties["date"] = String(date);
          properties["time"] = String(time);
          properties["sys_id"] = sys_id;
          temp["type"] = "Feature";
          temp["properties"] = properties;
          temp["geometry"] = geometry;
          features.push(temp);
        } else {
          await deletePublicFileUsingPath(
            `/images/geojson/${files[i].filename}`
          );
          badImages.push(files[i].filename);
        }
      }
      if (features.length) {
        geojson["features"] = features;
        geojson["type"] = req.body.type ? req.body.type : "FeatureCollection";
        geojson["name"] = req.body.name ? req.body.name : "";
        const filepath =
          "/vector/" + String(Date.now()) + "_" + req.body.name + ".geojson";
        const file = DirPath(Directory.DEFAULT, filepath);
        await fs.promises.writeFile(file, JSON.stringify(geojson));
        const size1: number = await getFileSize(file);
        const docCount = await Tenant.findOne({
          _id: res.locals.user.tenantId,
        })
          .populate<{ activePackage: IPackage }>("activePackage")
          .lean();

        const ress = await isSizeVector(size1, docCount, file);
        if (ress !== true) {
          for (let i = 0; i < files.length; i++) {
            await deletePublicFileUsingPath(
              `/images/geojson/${files[i].filename}`
            );
          }
          return res.status(403).json({
            status: false,
            message: "Actual storage exceeded the Limit of Set storage!",
          });
        }
        let vectorLayer: HydratedDocument<ILayer>;
        if (req.body.missionId == null) {
          vectorLayer = new Layer({
            name: "base- " + req.body.name,
            type: "Vector",
            vector: req.body.vectorId,
            tenantId: res.locals.user.tenantId._id,
            createdBy: res.locals.user._id,
            updatedBy: res.locals.user._id,
            color: req.body.color,
            fileSize: size1,
            layerpath: filepath,
            layerLabel: "filename",
            captureDate: new Date(),
            featureCount: features.length,
          });
        } else {
          vectorLayer = new Layer({
            name: req.body.name,
            type: "Vector",
            vector: req.body.vectorId,
            missionId: req.body.missionId,
            tenantId: res.locals.user.tenantId._id,
            createdBy: res.locals.user._id,
            updatedBy: res.locals.user._id,
            color: req.body.color,
            fileSize: size1,
            layerpath: filepath,
            layerLabel: "filename",
            captureDate: new Date(),
            featureCount: features.length,
          });
        }

        const savedDoc1 = await vectorLayer.save();

        const tenant = await Tenant.findOne({
          _id: res.locals.user.tenantId,
        });
        if (savedDoc1 && tenant.actualLayerCount >= 0) {
          await Tenant.updateOne(
            { _id: res.locals.user.tenantId },
            { $inc: { actualLayerCount: 1 } }
          );
        }
        if (savedDoc1) {
          // let dir:any = DirPath(Directory.DEFAULT, savedDoc1.layerpath);
          // let fc: any = geojson.features.length;
          let flag = false;
          for (let i = 0; i < allImageData.length; i++) {
            // for (let j = 0; j < req.files.length; j++) {
            // if (String(geojson.features[i].properties.filename) == String(req.files[j].filename)) {
            const size: number = Number(
              (Number(files[i]?.size) / (1024 * 1024)).toFixed(5)
            );
            const centerPoints2: any = {};
            centerPoints2["lng"] = allImageData[i].coordinates[0];
            centerPoints2["lat"] = allImageData[i].coordinates[1];
            const featureFile = new layerFiles({
              name: allImageData[i].originalname,
              layerId: savedDoc1._id,
              filePath: `/images/geojson/${allImageData[i].filename}`,
              fileSize: size,
              featureLabel: allImageData[i].filename,
              centerPoints: centerPoints2,
              fileType: allImageData[i].mimetype,
              sys_Id: allImageData[i].sys_id,
              isReview: true,
              tenantId: res.locals.user.tenantId,
              createdBy: res.locals.user._id,
              updatedBy: res.locals.user._id,
            });
            const savedDoc = await featureFile.save();
            if (savedDoc) flag = true;
            try {
              if (
                await checkFileExists(
                  DirPath(Directory.GEOJSON_IMAGES, allImageData[i].filename)
                )
              ) {
                // sharp(allImageData[i].path)
                //   .resize(120, 120, { withoutEnlargement: true })
                //   .toFile(DirPath(Directory.GEOJSON_IMAGES, newFilename))
                //   .then((result) => {})
                //   .catch((err) => {
                //     req.log.error(err);
                //   });
                await resizer(
                  DirPath(Directory.GEOJSON_IMAGES, allImageData[i].filename),
                  {
                    all: {
                      path: DirPath(Directory.GEOJSON_IMAGES, "/"),
                      quality: 80,
                    },
                    versions: [
                      {
                        prefix: "2x_",
                        width: 1280,
                        height: 720,
                      },
                      {
                        prefix: "1x_",
                        width: 120,
                        height: 120,
                      },
                    ],
                  }
                );
              }
            } catch (err) {
              req.log.error(err);
            }
            // }
            // }
          }
          if (flag == true) {
            const data = { badImages, result: savedDoc1 };
            missionSpecificSocket
              .to(savedDoc1.missionId.toString())
              .emit("pic-to-map", data);
          } else {
            const data = { badImages };
            missionSpecificSocket
              .to(savedDoc1.missionId.toString())
              .emit("pic-to-map", data);
          }
          res.status(201).json({
            status: true,
            message: "Sucessfully created the layer!",
          });
        } else {
          return res.status(200).json({
            status: false,
            message: "Layer creation failed",
          });
        }
      } else {
        return res.status(200).json({
          status: false,
          message:
            "Please upload the right files none of the images has geo-coordinates!",
        });
      }
    } else {
      return res.status(200).json({
        status: false,
        message: "Oops no images selected",
      });
    }
  }
};

// what is this even for?
export const sys_id_Inject = async (req: Request, res: AuthResponse) => {
  {
    const docs = await Layer.find<{ layerpath: string }>(
      {
        type: "Vector",
        tenantId: res.locals.user.tenantId,
      },
      {
        layerpath: 1,
      },
      {
        lean: true,
      }
    );
    if (docs.length) {
      for (let i = 0; i < docs.length; i++) {
        const docpath = DirPath(Directory.DEFAULT, docs[i].layerpath);
        const geoJSON = await readGeoJson(docpath);
        if (geoJSON) {
          const modCheck = await modGeoJson(null, null, geoJSON, docpath);
        } else {
          req.log.warn("Geojson Not found");
        }
      }
      res.send("Ok");
    }
  }
};

// this is just dead code
export const sysId_mapping = async (req: Request, res: AuthResponse) => {
  {
    const docs = await Layer.find({ tenantId: res.locals.user.tenantId });
    if (docs.length) {
    } else {
      res.status(200).json({
        status: false,
        message: "No layer documents found",
      });
    }
  }
};

export const sys_id_Inject_to_layerfiles = async (
  req: Request,
  res: AuthResponse
) => {
  {
    const docs = await Layer.findOne<{
      _id: ObjectId;
      layerpath: string;
      layerLabel: string;
      missionId: ObjectId;
    }>(
      {
        _id: req.query.layerId,
        tenantId: res.locals.user.tenantId._id,
        type: "Vector",
      },
      {
        layerpath: 1,
        layerLabel: 1,
        missionId: 1,
      }
    );
    if (docs) {
      if (docs.missionId) {
        const p = DirPath(Directory.DEFAULT, docs.layerpath);
        const gjson = await readGeoJson(p);

        if (gjson == null) {
          return res.json({
            status: false,
            message: "file path not exist! ",
          });
        }

        if (gjson) {
          for (let j = 0; j < gjson.features.length; j++) {
            if (
              !gjson.features[j].properties.sys_id ||
              gjson.features[j].properties.sys_id == "undefined"
            )
              gjson.features[j].properties.sys_id =
                new ObjectId().toHexString();
            await layerFiles.updateMany(
              {
                layerId: docs._id,
                featureLabel: gjson.features[j].properties[docs.layerLabel],
              },
              { sys_Id: gjson.features[j].properties.sys_id }
            );
            req.log.info("Modified Doc");
          }
        }
        await Fs.writeFile(p, JSON.stringify(gjson));
        res.status(200).json({
          status: true,
          message: "Generated sysIds successfully",
        });
      } else {
        res.status(404).json({
          status: false,
          message: "Layer not found",
        });
      }
    } else {
      res.status(404).json({
        status: false,
        message: "No layer documents found",
      });
    }
  }
};

export const flagFeature = async (
  req: Request<{
    layerID: Types.ObjectId;
  }>,
  res: AuthResponse
) => {
  const layerToUpdate = await Layer.findOneAndUpdate(
    {
      tenantId: res.locals.user.tenantId._id,
      _id: req.params.layerID,
    },
    {
      [req.body.flag ? "$addToSet" : "$pullAll"]: {
        flaggedFeatures: req.body.featureIndex,
      },
    }
  );
  const updatedLayer = await Layer.findOne({
    tenantId: res.locals.user.tenantId._id,
    _id: req.params.layerID,
  });
  if (updatedLayer.flaggedFeatures.length === 0) {
    await Layer.updateOne(
      {
        tenantId: res.locals.user.tenantId._id,
        _id: req.params.layerID,
      },
      {
        $set: {
          isFlagged: false,
        },
      }
    );
  } else {
    await Layer.updateOne(
      {
        tenantId: res.locals.user.tenantId._id,
        _id: req.params.layerID,
      },
      {
        $set: {
          isFlagged: true,
        },
      }
    );
  }
  if (layerToUpdate != null) {
    res.status(200).json({
      status: true,
      message: `feature ${
        req.body.flag ? "flagged" : "unflagged"
      } successfully`,
    });
  } else {
    res.status(501).json({
      status: false,
      message: "feature flagging failed",
    });
  }
};

export const flagLayer = async (
  req: Request<{ layerID: Types.ObjectId }>,
  res: AuthResponse
) => {
  let updatedLayer = await Layer.updateOne(
    {
      tenantId: res.locals.user.tenantId._id,
      _id: req.params.layerID,
    },
    {
      isFlagged: req.body.flag,
    }
  );
  if (req.body.flag === false) {
    updatedLayer = await Layer.updateOne(
      {
        tenantId: res.locals.user.tenantId._id,
        _id: req.params.layerID,
      },
      {
        $set: {
          flaggedFeatures: [],
        },
      }
    );
  }
  if (updatedLayer != null) {
    res.status(200).json({
      status: true,
      message: "layer flagged successfully",
    });
  } else {
    res.status(501).json({
      status: false,
      message: "layer flagging failed",
    });
  }
};

export const publicLayerByMissionId = async (
  req: Request,
  res: AuthResponse
) => {
  const publicMission = await Mission.findOne({
    _id: req.params.missionId,
    tenantId: req.params.tenantId,
    isPublic: true,
  });
  if (!publicMission) {
    res.status(404).json({
      status: false,
      message: "public mission does not exist",
    });
    return;
  }

  const layers = await Layer.find({ missionId: publicMission._id })
    .populate<{
      tenantId: ITenant;
    }>("tenantId", "name")
    .populate<{ raster: IRaster }>({ path: "raster" })
    .populate<{ vector: IVector }>({ path: "vector" });
  const flight = await Flight.findOne<{
    centerPoints: {
      lat: number;
      lng: number;
    };
  }>(
    {
      mission: req.params.missionId,
      tenant: req.params.tenantId,
    },
    {
      centerPoints: 1,
    }
  );
  res.json({
    status: true,
    message: "found mission and layers",
    centerPoints: flight.centerPoints,
    mission: publicMission,
    data: layers,
  });
  return;
};
