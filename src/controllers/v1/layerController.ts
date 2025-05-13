import path, { basename } from "path";

import nearestPoint from "@turf/nearest-point";
import type { NearestPoint } from "@turf/nearest-point";
import * as turf from "@turf/turf";
import { ObjectId } from "bson";
import { subWeeks, subDays, subMonths, subYears } from "date-fns";
import exifr from "exifr";

import type { Request } from "express";
import Layer from "../../models/layer";
import layerFiles from "../../models/layerFiles";
import Tenant from "../../models/tenant";
import { missionSpecificSocket } from "../../socket";
import Mission from "../../models/mission";
import {
  createArchive,
  deleteFeatureSearchIndex,
  permPath,
  saveAsKML,
  saveCSV,
  saveFeatureSearchIndex,
  saveGeojson,
  saveVectorLayer,
} from "../../utils/dataUtils";
import { deletePublicFileUsingPath } from "../../utils/fileDeleteUtils";
import {
  modGeoJson,
  readGeoJson,
  editGeoJsonForAll,
  deleteGeoJsonFeature,
  featureAddition,
  Feature,
  Point,
} from "../../utils/geojsonUtils";

import Flight from "../../models/flight";
import { rasterProps } from "../../schemas/rasterprops";
import type { IPackage } from "../../schemas/package";
import type { ILayerGroup } from "../../schemas/layerGroup";
import {
  Directory,
  DirPath,
  TITILER_SERVER,
  TITILER_STATIC,
} from "../../constants";

import { Types } from "mongoose";

import type { ILayerFile } from "../../schemas/layerFiles";
import { checkFileExists } from "../../utils/fileUtils";
import type { ITenant } from "../../schemas/tenant";
import { saveThumbnails } from "../../utils/imageUtils";
import type { AuthResponse } from "../../utils/interfaceUtils";
import { createMixedLayerGroup } from "../../utils/layerUtils";
import { readToBuffer } from "../../utils/objectStorage";
import { LazToTiles3D } from "../../utils/pointcloud";
import { decompressZip } from "../../utils/cesium";
import UploadTask from "../../models/uploadTask";
import { featureType, vectorProps } from "../../schemas/vectorprops";

// ********* create ***********

export const createLayer = async (req: Request, res: AuthResponse) => {
  const fileDoc = await UploadTask.findOne({
    _id: req.body.file,
    tenant: res.locals.user.tenantId._id,
    createdBy: res.locals.user._id,
    // status: "started",
  });
  let layer;
  if (req.params.type == "Vector") {
    let geojsonPath = "";
    let size = 0;
    let featureCount = 0;
    let flagColor = "";
    let featureTypes = [];
    try {
      const vectorLayer = await saveVectorLayer(fileDoc.metadata.objectkey, {
        icon: req.body.icon,
        color: req.body.color,
        inheritColor: req.body.inHeritOriginalColorFromFile,
      },
        req.body.properties,
      );

      if (vectorLayer == undefined) {
        res.status(400).json({
          status: false,
          message: "vector format not supported",
        });
        return;
      }

      geojsonPath = vectorLayer.geojsonPath;
      size = vectorLayer.size;
      featureCount = vectorLayer.featureCount;
      flagColor = vectorLayer.flagColor;
      featureTypes = vectorLayer.featureTypes;
    } catch (error) {
      req.log.error(error, "vector layer conversion failed");
      res.status(500).json({
        status: false,
        message: "file conversion failed",
      });
      return;
    }
    const { name, type, vector, captureDate, missionId, layerGroupId } =
      req.body;
    if (featureTypes.length > 1) {
      layer = (
        await createMixedLayerGroup({
          name,
          missionId,
          tenantId: res.locals.user.tenantId._id,
          userId: res.locals.user._id,
          geojson: geojsonPath,
          featureTypes,
          captureDate,
        })
      )[0];
    } else {
      layer = await Layer.create({
        name,
        type,
        vector,
        color: flagColor,
        layerpath: geojsonPath,
        fileSize: size,
        featureCount: featureCount,
        layerGroupId,
        captureDate,
        missionId,
        tenantId: res.locals.user.tenantId,
        createdBy: res.locals.user._id,
        updatedBy: res.locals.user._id,
      });
    }
  } else if (req.params.type == "Raster") {
    //----------TITILER API HAS CHANGED-------------------
    //  Metadata api has been removed
    // instead there is statistics api and info api
    const { name, raster, captureDate, missionId, layerGroupId } = req.body;
    const rasterType = raster as rasterProps;
    if (!Object.values(rasterProps).includes(rasterType)) {
      res.status(404).json({
        status: false,
        message: "raster type not found",
      });
      return;
    }
    let minP = 0;
    let maxP = 1;
    let center = { lng: 0, lat: 0 };
    let metadata = {};
    if (rasterType == rasterProps.DEM) {
      let metaDataURL = `${TITILER_SERVER}/cog/statistics?url=${TITILER_STATIC}/${fileDoc.metadata.objectkey}`;
      req.log.info("fetching metadata from titiler");
      let response = await fetch(metaDataURL, {
        method: "GET",
      });
      req.log.info(response, "getResponse data :  ");
      let metadata = await response.json();
      req.log.info(metadata, "get metadata data :  ");
      //-------handle for detail:not found----
      minP = metadata["b1"]["min"];
      maxP = metadata["b1"]["max"];
      metaDataURL = `${TITILER_SERVER}/cog/info?url=${TITILER_STATIC}/${fileDoc.metadata.objectkey}`;
      response = await fetch(metaDataURL, {
        method: "GET",
      });
      metadata = await response.json();
      center = {
        lng: (metadata["bounds"][0] + metadata["bounds"][2]) / 2,
        lat: (metadata["bounds"][1] + metadata["bounds"][3]) / 2,
      };
    } else if (rasterType == rasterProps.POINT_CLOUD) {
      const POINTCLOUD_LIMIT = 1e3;
      if (fileDoc.metadata.filesize > POINTCLOUD_LIMIT) {
        req.log.error(
          { POINTCLOUD_LIMIT, file: fileDoc.metadata.objectkey },
          "pointcloud too large, not converting",
        );
      } else {
        metadata = await LazToTiles3D(fileDoc.metadata.objectkey);
      }
    }
    const fullPath = await permPath(
      Directory.RASTER,
      fileDoc.metadata.objectkey,
    );
    layer = new Layer({
      name,
      type: "Raster",
      raster: rasterType,
      layerpath: fullPath,
      fileSize: fileDoc.metadata.filesize,
      minp: minP,
      maxp: maxP,
      layerGroupId,
      center: center,
      captureDate,
      missionId,
      tenantId: res.locals.user.tenantId,
      createdBy: res.locals.user._id,
      updatedBy: res.locals.user._id,
      metadata,
    });
  } else {
    return res.json({
      status: false,
      message: "wrong input! choose either Raster nor Vector",
    });
  }
  if (layer) {
    const savedDoc = await layer.create();
    await fileDoc.delete();

    if (layer.raster == rasterProps.CESIUM_3D) {
      // Extract zip, locate tileset, move to correct location
      decompressZip(layer.layerpath, {
        layer_id: layer._id.toString(),
        tenant_id: layer.tenantId.toString(),
        mission_id: layer.missionId.toString(),
        user_id: layer.createdBy.toString(),
      });
    }
    const layers = await Layer.findOne({ _id: savedDoc._id }).populate<{
      tenantId: ITenant;
    }>("tenantId", "name");
    res.status(201).json({
      status: true,
      message: "New Layer Created",
      data: layers,
    });
  }
};

export const updateLayer = async (req: Request, res: AuthResponse) => {
  const doc = await Layer.findOne({
    _id: req.query.id,
    tenantId: res.locals.user.tenantId._id,
  });
  if (doc) {
    doc.name = req.body.name;
    doc.captureDate = req.body.captureDate;

    if (req.body.layerType) {
      if (doc.type === "Vector") {
        // for Vector: geometry must match
        // edit layer type
        const currentType = doc.vector;
        const requestedType = String(req.body.layerType) as vectorProps;
        if (!Object.values(vectorProps).includes(requestedType)) {
          res.status(404).json({
            status: false,
            message: "layer type not found",
          });
          return;
        } else if (featureType[currentType] !== featureType[requestedType]) {
          res.status(400).json({
            status: false,
            message: "geometry of previous type doesn't match new type",
          });
          return;
        } else {
          doc.vector = requestedType;
        }
      } else {
        // for Raster
        const requestedType = String(req.body.layerType) as rasterProps;
        if (!Object.values(rasterProps).includes(requestedType)) {
          res.status(404).json({
            status: false,
            message: "layer type not found",
          });
          return;
        }
        doc.raster = requestedType;
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
      },
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
};

export const deleteLayer = async (req: Request, res: AuthResponse) => {
  const d = await Layer.findOne({
    _id: req.query.id,
    tenantId: res.locals.user.tenantId._id,
  });
  if (d) {
    if (d.isBase) {
      return res.status(200).json({
        status: false,
        message: "Cannot delete layer which is being used by Base Layer",
      });
    } else {
      await d.delete();
      res.status(200).json({
        status: true,
        message: "Layer successfully deleted",
        data: d,
      });
    }
  } else {
    res.json({
      status: false,
      message: "Layer ID does not match",
    });
  }
};

export const deleteMultipleLayers = async (req: Request, res: AuthResponse) => {
  const layers = req.body.layers;
  for (const layerId of layers) {
    const d = await Layer.findOne({
      _id: layerId,
      tenantId: res.locals.user.tenantId._id,
    });
    if (d) {
      await d.delete();
    } else {
      req.log.warn("Layer id doesn't match");
    }
  }

  res.status(200).json({
    status: true,
    message: "Layer successfully deleted",
    data: layers,
  });
};

export const addFeature = async (req: Request, res: AuthResponse) => {
  const data = await Layer.findOne({
    _id: req.body.id,
    tenantId: res.locals.user.tenantId._id,
  });
  if (data.type == "Vector") {
    if (data) {
      if (req.body.feature) {
        const docpath = DirPath(Directory.ROOT, data.layerpath);
        const geojson = await readGeoJson(docpath);
        if (geojson == null) {
          return res.json({
            status: false,
            message: "file path not exist! ",
          });
        }
        const { filepath: newPath, size } = await featureAddition(
          docpath,
          req.body,
          geojson,
        );
        if (data.isPublic) {
          // for public layer, re-generate search index after feature editing
          await saveFeatureSearchIndex(newPath); // save new search index
          await deleteFeatureSearchIndex(data.layerpath); // delete old search index
        }
        if (data.color != req.body.feature.properties.color) {
          data.color = "multiColor";
          await data.save();
        }
        const updatedLayer = await data.updateFile(newPath, size);
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
};

export const editGeoJson = async (
  req: Request<
    {},
    {},
    {
      id: Types.ObjectId;
      featureIndex: number;
      feature: object;
    }
  >,
  res: AuthResponse,
) => {
  const data = await Layer.findOne({
    _id: req.body.id,
    tenantId: res.locals.user.tenantId._id,
  });
  if (data) {
    if (req.body.feature && String(req.body.featureIndex)) {
      const docpath = DirPath(Directory.ROOT, data.layerpath);
      const geojson = await readGeoJson(docpath);
      if (geojson == null) {
        return res.json({
          status: false,
          message: "file path not exist! ",
        });
      }
      const { filepath: newPath, size } = await editGeoJsonForAll(
        docpath,
        req.body,
        geojson,
      );
      if (data.isPublic) {
        // for public layer, re-generate search index after feature editing
        await saveFeatureSearchIndex(newPath); // save new search index
        await deleteFeatureSearchIndex(data.layerpath); // delete old search index
      }
      let updatedColor: string = geojson.features[0].properties.color;
      for (const feature of geojson.features) {
        if (feature.properties.color != updatedColor) {
          updatedColor = "multicolor";
          break;
        }
      }
      data.color = updatedColor;
      await data.save();
      const savedDoc = await data.updateFile(newPath, size);
      return res.status(200).json({
        status: true,
        message: "Successfully edited GEOJSON",
        data: savedDoc,
      });
    } else {
      return res.status(404).json({
        status: false,
        message: "Feature Error",
      });
    }
  } else {
    res.status(404).json({
      status: false,
      message: "Layer ID does not match",
    });
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
  res: AuthResponse,
) => {
  const data = await Layer.findOne({
    _id: req.body.id,
    tenantId: res.locals.user.tenantId._id,
  });
  if (data) {
    const flaggedFeatures = data.flaggedFeatures
      .filter((index) => index != req.body.featureIndex)
      .map((index) => (index > req.body.featureIndex ? index - 1 : index));
    data.flaggedFeatures = flaggedFeatures;
    if (flaggedFeatures.length === 0) data.isFlagged = false;
    await data.save();
    const docpath = DirPath(Directory.ROOT, data.layerpath);
    const geojson = await readGeoJson(docpath);
    if (geojson == null) {
      return res.json({
        status: false,
        message: "file path not exist! ",
      });
    }
    const { filepath: newPath, size } = await deleteGeoJsonFeature(
      docpath,
      req.body,
      geojson,
    );
    const savedDoc = await data.updateFile(newPath, size);
    if (data.isPublic) {
      // for public layer, re-generate search index after feature editing
      await saveFeatureSearchIndex(newPath); // save new search index
      await deleteFeatureSearchIndex(data.layerpath); // delete old search index
    }
    return res.status(200).json({
      status: true,
      message: "Feature Deleted successfully",
      data: savedDoc,
    });
  } else {
    res.json({
      status: false,
      message: "Layer ID does not match",
    });
  }
};

export const uploadmultiplefile = async (req: Request, res: AuthResponse) => {
  const fileDoc = await UploadTask.findOne({
    _id: req.body.file,
    tenant: res.locals.user.tenantId._id,
    createdBy: res.locals.user._id,
    // status: "started",
  });
  const layerId = req.body.layerId;
  const sys_Id = req.body.sys_Id;
  if (!fileDoc) {
    throw new Error("no file in request");
  }
  const fullPath = await permPath(
    Directory.GEOJSON_IMAGES,
    fileDoc.metadata.objectkey,
  );
  const featureFile = new layerFiles({
    name: fileDoc.metadata.originalName,
    layerId: layerId,
    filePath: fullPath,
    fileSize: fileDoc.metadata.filesize,
    isReview: true,
    featureLabel: req.body.featureLabel,
    centerPoints: {
      lng: req.body.centerPoints.lng,
      lat: req.body.centerPoints.lat,
    },
    fileType: fileDoc.metadata.mimetype,
    sys_Id: sys_Id,
    tenantId: res.locals.user.tenantId,
    createdBy: res.locals.user._id,
    updatedBy: res.locals.user._id,
  });

  const savedDoc = await featureFile.create();
  await fileDoc.delete();
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
};

export const getbymissionID = async (req: Request, res: AuthResponse) => {
  const id = req.query.missionId as string;
  const isClient = res.locals.user.userType === "tenant-client";
  const mission = await Mission.findOne<{
    name: string;
    clientId: Types.ObjectId[];
  }>(
    {
      _id: id,
      tenantId: res.locals.user.tenantId._id,
    },
    {
      name: 1,
      clientId: 1,
    },
  );
  if (isClient && !mission.clientId.includes(res.locals.user._id)) {
    return res.status(403).json({
      status: false,
      message: `Client does not have access to the mission`,
    });
  }
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
    },
  );

  const doc = await Layer.find({
    missionId: id,
    tenantId: res.locals.user.tenantId._id,
  }).populate<{ layerGroupId: ILayerGroup }>("layerGroupId");

  res.status(200).json({
    status: true,
    message: "Layer fetched successfully",
    data: {
      mission: mission["name"],
      centerPoints: flight.centerPoints,
      layers: doc,
    },
  });
};

export const getrasterdetailsbyID = async (req: Request, res: AuthResponse) => {
  const id = req.query.id;
  const result = [];
  const doc = await Layer.findOne({
    _id: id,
    tenantId: res.locals.user.tenantId._id,
  });
  if (doc.type == "Raster") {
    const fname = doc.layerpath.split(/[\\\/]/)[2];
    if (fname) {
      result.push({
        _id: doc._id,
        createdBy: doc.createdBy,
        createdAt: doc.createdAt,
        captureDate: doc.captureDate,
        fileName: fname,
        fileSize: doc.fileSize,
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
};

export const changecolorbyID = async (req: Request, res: AuthResponse) => {
  const id: any = req.body.id;
  const color: any = req.body.color;
  const icon: any = req.body.icon;
  const doc = await Layer.findById({
    _id: id,
    tenantId: res.locals.user.tenantId._id,
  });
  const docpath = DirPath(Directory.ROOT, doc.layerpath);
  const geojson = await readGeoJson(docpath);
  if (geojson == null) {
    return res.json({
      status: false,
      message: "file path not exist! ",
    });
  }
  const { filepath: newPath, size } = await modGeoJson(
    icon,
    color,
    geojson,
    docpath,
  );
  doc.color = req.body.color as string;
  await doc.save();
  if (doc.isPublic) {
    // for public layer, re-generate search index after feature editing
    await saveFeatureSearchIndex(newPath); // save new search index
    await deleteFeatureSearchIndex(doc.layerpath); // delete old search index
  }
  const updatedLayer = await doc.updateFile(newPath, size);
  if (updatedLayer) {
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
};

export const downloadassetbyID = async (req: Request, res: AuthResponse) => {
  const id: any = req.query.id;
  const doc = await Layer.findOne({
    _id: id,
    tenantId: res.locals.user.tenantId._id,
  });
  const dir = DirPath(Directory.ROOT, doc.layerpath);
  if (await checkFileExists(dir)) {
    res.json({
      status: true,
      message: `Download Link generated for LayerID: ${id}`,
      link: doc.layerpath,
    });
  } else {
    res.json({
      status: false,
      message: `File does not exist`,
    });
  }
};

export const createVectorLayer = async (req: Request, res: AuthResponse) => {
  const vectorLayer = await saveVectorLayer(req.body.geoJSON, {
    inheritColor: true,
  }, req.body.properties);
  const layer = await new Layer({
    name: req.body.name,
    type: "Vector",
    vector: req.body.vectorType,
    missionId: req.body.missionId,
    tenantId: res.locals.user.tenantId._id,
    createdBy: res.locals.user._id,
    updatedBy: res.locals.user._id,
    color: vectorLayer.flagColor,
    fileSize: vectorLayer.size,
    layerpath: vectorLayer.geojsonPath,
    featureCount: vectorLayer.featureCount,
    captureDate: new Date(),
  }).create();

  if (layer) {
    res.status(201).json({
      status: true,
      message: "Sucessfully created vector layer",
      data: layer,
    });
  } else {
    res.status(201).json({
      status: false,
      message: "Failed to create vector layer",
    });
  }
};

export const sortallLayer = async (req: Request, res: AuthResponse) => {
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
  res: AuthResponse,
) => {
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
  const d = new Map();
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
        .exec();
      if (!result.length)
        return res.json({
          status: false,
          message: "Data doesn't exist!",
        });
      for (const layer of result) {
        if (layer.vector || layer.raster) {
          d.set(layer._id.toHexString(), layer);
        }
      }
    } else if (req.body.type[0] === "Raster") {
      const result = await Layer.find({
        type: req.body.type,
        missionId: req.body.missionId,
        createdAt: {
          $gte: startTime,
          $lte: endTime,
        },
      }).sort(sort);
      if (!result.length)
        return res.json({
          status: false,
          message: "Data doesn't exist!",
        });
      for (const layer of result) {
        if (layer.raster) {
          d.set(layer._id.toHexString(), layer);
        }
      }
    } else if (req.body.type[0] === "Vector") {
      const result = await Layer.find({
        type: req.body.type,
        missionId: req.body.missionId,
        createdAt: {
          $gte: startTime,
          $lte: endTime,
        },
      }).sort(sort);
      if (!result.length)
        return res.json({
          status: false,
          message: "Data doesn't exist!",
        });
      for (const layer of result) {
        if (layer.vector) {
          d.set(layer._id.toHexString(), layer);
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
      .exec();
    if (!result.length)
      return res.json({
        status: false,
        message: "Data doesn't exist!",
      });
    for (const layer of result) {
      if (layer.vector || layer.raster) {
        d.set(layer._id.toHexString(), layer);
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
    }).sort(sort);
    for (const layer of result) {
      for (const t of match3.type) {
        if (layer.vector) {
          if (featureType[layer.vector] == t) {
            d.set(layer._id.toHexString(), layer);
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
    }).sort(sort);
    for (const layer of result) {
      for (const name of match2.name) {
        if (layer.vector) {
          if (layer.vector == name) {
            d.set(layer._id.toHexString(), layer);
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
    }).sort(sort);
    for (const layer of result) {
      for (const name of match.name) {
        if (layer.raster) {
          if (layer.raster == name) {
            d.set(layer._id.toHexString(), layer);
          }
        }
      }
    }
  }
  if (d.size) {
    return res.json({
      status: true,
      message: "Sucessfully get Vector or Raster data ",
      data: Array.from(d.values()),
    });
  } else
    return res.json({
      status: false,
      message: " data not match!",
    });
};

export const getFeatureByLayerId = async (req: Request, res: AuthResponse) => {
  const result = await Layer.findOne({
    _id: req.body.id,
    tenantId: res.locals.user.tenantId._id,
  });
  if (result) {
    const docpath = DirPath(Directory.ROOT, result.layerpath);
    const geojson = await readGeoJson(docpath);
    if (geojson == null) {
      return res.json({
        status: false,
        message: "file path not exist!",
      });
    }
    const flaggedFeatures = result.flaggedFeatures ?? [];
    const filterFlagged = (data) => {
      const isFlagged = req.body.isFlagged;
      if (isFlagged !== undefined && flaggedFeatures.length > 0) {
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
      total: result.featureCount,
    });
  } else
    return res.status(400).json({
      status: false,
      message: "Layer Id does not match! ",
    });
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
  res: AuthResponse,
) => {
  const result = await Layer.findOne({
    _id: req.body.id,
    tenantId: res.locals.user.tenantId._id,
  });
  if (result) {
    const docpath = DirPath(Directory.ROOT, result.layerpath);
    const geojson = await readGeoJson(docpath);
    if (geojson == null) {
      return res.json({
        status: false,
        message: "file path not exist!",
      });
    }
    const geoArray: any = [];
    const clone: any = [];
    if (req.body.featureIndex) {
      if (req.body.featureIndex.length <= geojson.features.length) {
        for (const idx of req.body.featureIndex) {
          geoArray.push(geojson.features[idx].properties);
        }
        for (const properties of geoArray) {
          clone.push(omit(properties, ["sys_id", "icon", "color"]));
        }
      } else
        return res.json({
          status: false,
          message: ` client requirement geojson features exceeds the exist geojson features count!${geojson.features.length} `,
        });
    } else {
      for (const feature of geojson.features) {
        geoArray.push(feature.properties);
      }
      for (const properties of geoArray) {
        clone.push(omit(properties, ["sys_id", "icon", "color"]));
      }
    }
    const filename = "features-" + String(result._id) + ".csv";
    const { filepath } = await saveCSV(
      filename,
      clone,
      result.missionId,
      res.locals.user.tenantId._id,
      res.locals.user._id,
    );
    res.json({
      status: true,
      message: "csv file created successfully!",
      pathh: filepath,
    });
  } else
    return res.status(400).json({
      status: false,
      message: "Layer Id does not match! ",
    });
};
export const uploadfiletoLayer = async (req: Request, res: AuthResponse) => {
  const fileDoc = await UploadTask.findOne({
    _id: req.body.file,
    tenant: res.locals.user.tenantId._id,
    createdBy: res.locals.user._id,
    // status: "started",
  });
  const layerId = req.body.layerId;
  const fullPath = await permPath(
    Directory.GEOJSON_IMAGES,
    fileDoc.metadata.objectkey,
  );
  const layerfile = new layerFiles({
    name: fileDoc.metadata.originalName,
    layerId: layerId,
    filePath: fullPath,
    fileSize: fileDoc.metadata.filesize,
    fileType: fileDoc.metadata.mimetype,
    tenantId: res.locals.user.tenantId,
    createdBy: res.locals.user._id,
    updatedBy: res.locals.user._id,
  });
  const savedDoc = await layerfile.create();
  await fileDoc.delete();
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
};

export const deleteimagesfromgeojson = async (
  req: Request,
  res: AuthResponse,
) => {
  const data = await layerFiles.findOne({
    _id: req.query.id,
    tenantId: res.locals.user.tenantId._id,
  });
  if (data) {
    await data.delete();
    res.status(200).json({
      status: true,
      message: `File deleted`,
      data: data,
    });
  } else {
    res.status(200).json({
      status: false,
      message: "FileId does not exist",
    });
  }
};

export const getfilesbylayerIdandfIndex = async (
  req: Request,
  res: AuthResponse,
) => {
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
};

export const setCoverPhotoByLayerFiles = async (
  req: Request,
  res: AuthResponse,
) => {
  const resultOne = await layerFiles.updateOne(
    {
      _id: req.body.id,
      layerId: req.body.layerId,
      tenantId: res.locals.user.tenantId,
      sys_Id: req.body.sys_id,
    },
    {
      coverPhoto: req.body.coverPhoto,
    },
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
    },
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
};

export const autoAssignImage = async (req: Request, res: AuthResponse) => {
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
  const docpath = DirPath(Directory.ROOT, layerDoc.layerpath);
  const geojson = await readGeoJson(docpath);
  const flaggedIndex: number[] = [];
  const message: {
    layerName: string;
    data: ILayerFile[];
    badImages: string[];
  } = {
    layerName: layerDoc.name,
    data: [],
    badImages: [],
  };

  const fileDocs = await UploadTask.find({
    _id: { $in: req.body.file },
    tenant: res.locals.user.tenantId._id,
    createdBy: res.locals.user._id,
    // status: "started",
  });

  if (req.query.mode == "GeoCoord") {
    let snapRadius: number = 120; // meters
    if (req.body.radius) {
      const tmpRadius = Number(req.body.radius);
      if (tmpRadius > 0) {
        snapRadius = tmpRadius;
      }
    }
    req.log.info("snapping radius", snapRadius);
    // Nearest point finder
    const collection = turf.featureCollection<turf.Point>(
      geojson.features.map(
        (feature: { geometry: { coordinates: turf.helpers.Position } }) =>
          turf.point(feature.geometry.coordinates),
      ),
    );
    for (let j = 0; j < fileDocs.length; j++) {
      req.log.info("file number", j);
      let closestPoint: NearestPoint;
      // catch bad image
      try {
        const { latitude, longitude } = await exifr.gps(
          await readToBuffer(fileDocs[j].metadata.objectkey),
        );
        if (latitude == null || longitude == null) {
          throw new Error("invalid coordinates!");
        }
        const imagePoint = turf.point([longitude, latitude]);
        closestPoint = nearestPoint(imagePoint, collection);
        const distance = turf.distance(imagePoint, closestPoint, {
          units: "meters",
        });
        if (distance > snapRadius) {
          throw new Error("image outside bounds!");
        }
      } catch (err) {
        req.log.error(err);
        message.badImages.push(fileDocs[j].metadata.objectkey);
        req.log.error("bad image", fileDocs[j].metadata.objectkey);
        continue;
      }
      req.log.info("good image", fileDocs[j].metadata.objectkey);

      // this is the original closest point
      const findex = geojson.features[closestPoint.properties.featureIndex];

      const layerId = req.body.Id;
      const centerPoints2 = {
        lng: String(closestPoint.geometry.coordinates[0]),
        lat: String(closestPoint.geometry.coordinates[1]),
      };
      const fullPath = await permPath(
        Directory.GEOJSON_IMAGES,
        fileDocs[j].metadata.objectkey,
      );
      const featureFile = new layerFiles({
        name: fileDocs[j].metadata.originalName,
        layerId: layerId,
        filePath: fullPath,
        fileSize: fileDocs[j].metadata.filesize,
        //! too complex
        featureLabel: layerDoc.layerLabel
          ? (findex.properties[layerDoc.layerLabel] ?? null)
          : null,
        centerPoints: centerPoints2,
        fileType: fileDocs[j].metadata.mimetype,
        sys_Id: findex.properties.sys_id,
        tenantId: res.locals.user.tenantId,
        createdBy: res.locals.user._id,
        updatedBy: res.locals.user._id,
      });
      const savedDoc = await featureFile.create();
      await fileDocs[j].delete();
      if (savedDoc) {
        message.data.push(savedDoc);
        flaggedIndex.push(closestPoint.properties.featureIndex);
      }
    }
  } else if (req.query.mode == "LayerLabel") {
    req.log.info(layerDoc.layerLabel, "Layer Label");
    const labelLookupMap = new Map(
      geojson.features.map((feature, index) => [
        String(feature.properties[layerDoc.layerLabel]),
        index,
      ]),
    );
    for (const uploadFile of fileDocs) {
      req.log.info(uploadFile.metadata.originalName, "Processing file name");
      const fileLabel = path.parse(uploadFile.metadata.originalName).name;
      const matchedFeatureIndex = labelLookupMap.get(fileLabel);
      if (matchedFeatureIndex == undefined) {
        message.badImages.push(uploadFile.metadata.objectkey);
        continue;
      }
      const matchedFeature = geojson.features[matchedFeatureIndex];
      const centroid = turf.centroid(matchedFeature.geometry);
      const centerPoints = {
        lng: centroid.geometry.coordinates[0],
        lat: centroid.geometry.coordinates[1],
      };
      const fullPath = await permPath(
        Directory.GEOJSON_IMAGES,
        uploadFile.metadata.objectkey,
      );
      const featureFile = new layerFiles({
        name: uploadFile.metadata.originalName,
        layerId: layerDoc._id,
        filePath: fullPath,
        fileSize: uploadFile.metadata.filesize,
        //! too complex
        featureLabel: fileLabel,
        centerPoints: centerPoints,
        fileType: uploadFile.metadata.mimetype,
        sys_Id: matchedFeature.properties.sys_id,
        tenantId: res.locals.user.tenantId,
        createdBy: res.locals.user._id,
        updatedBy: res.locals.user._id,
      });
      const savedDoc = await featureFile.create();
      await uploadFile.delete();
      if (savedDoc) {
        message.data.push(savedDoc);
        flaggedIndex.push(matchedFeatureIndex);
      }
    }
  }
  await layerDoc.updateOne({
    $addToSet: {
      flaggedFeatures: flaggedIndex,
    },
  });
  req.log.info(message, "AUTO ASSIGN MESSAGE");
  missionSpecificSocket
    .to(missionId.toString())
    .emit("ASSIGNED SUCESSFULLY", message);
  req.log.info("sent");
};

export const assignlayerLabel = async (req: Request, res: AuthResponse) => {
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
        { layerPopupLabel: req.body.label },
      );
    } else {
      savedDoc = await Layer.updateOne(
        { _id: req.body.layerId },
        { layerLabel: req.body.label },
      );
    }

    if (savedDoc) {
      const d = await Layer.findOne({
        _id: req.body.layerId,
        tenantId: res.locals.user.tenantId._id
          ? res.locals.user.tenantId._id
          : res.locals.user.tenantId,
      }).populate<{ layerGroupId: ILayerGroup }>("layerGroupId");

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
        { featureLabel: req.body.label },
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
};

export const imageReviewforLayerFileId = async (
  req: Request,
  res: AuthResponse,
) => {
  const layerDoc = await Layer.findOne({
    _id: req.body.layerId,
    tenantId: res.locals.user.tenantId,
  });
  if (layerDoc) {
    const docpath = DirPath(Directory.ROOT, layerDoc.layerpath);
    const geojson = await readGeoJson(docpath);
    for (const element of req.body.check) {
      const doc = await layerFiles.findOne({
        _id: element._id,
        tenantId: res.locals.user.tenantId,
      });
      const sys_Id: any = element.sys_Id;
      for (let j = 0; j < geojson.features.length; j++) {
        if (geojson.features[j].properties.sys_id == sys_Id) {
          const centerPoints2 = {
            lat: String(geojson.features[j].geometry.coordinates[1]),
            lng: String(geojson.features[j].geometry.coordinates[0]),
          };
          if (doc) {
            doc.isReview = true;
            if (
              String(doc.sys_Id) != String(element.sys_Id || doc.sys_Id == null)
            ) {
              doc.sys_Id = geojson.features[j].properties.sys_id;
              doc.featureLabel = layerDoc.layerLabel
                ? (geojson.features[j].properties[layerDoc.layerLabel] ?? j)
                : j;
              doc.centerPoints = centerPoints2;
            }
            await doc.save();
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
};

export const unreviewedLayerfiles = async (req: Request, res: AuthResponse) => {
  const docs = await layerFiles.find({
    layerId: req.query.layerId,
    isReview: false,
    tenantId: res.locals.user.tenantId._id,
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
};

export const zipbymissionId = async (req: Request, res: AuthResponse) => {
  const d = await Layer.find({
    missionId: req.query.missionId,
    tenantId: res.locals.user.tenantId._id,
  });
  const missionId: string = String(req.query.missionId);
  const filename = "allLayers-" + missionId + ".zip";
  if (d.length) {
    res.status(200).json({
      status: true,
      message: "Zipping Started",
    });
    missionSpecificSocket.to(missionId).emit("LAYER_ZIP_START");
    try {
      const archive = await createArchive(
        filename,
        d.map((layer) => layer.layerpath),
        missionId,
        res.locals.user.tenantId._id,
        res.locals.user._id,
      );
      missionSpecificSocket.to(missionId).emit("LAYER_ZIP_COMPLETED", archive);
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
};

export const downloadassetbyIDtoKml = async (
  req: Request,
  res: AuthResponse,
) => {
  const id = String(req.query.id);
  const doc = await Layer.findOne({
    _id: id,
    tenantId: res.locals.user.tenantId._id,
  });
  const geojson = await readGeoJson(DirPath(Directory.ROOT, doc.layerpath));
  const filename = String(doc._id) + ".kml";
  const { filepath: downloadlink } = await saveAsKML(
    filename,
    geojson,
    doc.missionId,
    res.locals.user.tenantId._id,
    res.locals.user._id,
  );
  res.json({
    status: true,
    message: `Download Link generated for LayerID: ${id}`,
    link: downloadlink,
  });
};

export const gen2x = async (req: Request, res: AuthResponse) => {
  const docs = await layerFiles.find(
    {
      tenantId: res.locals.user.tenantId,
    },
    {
      fileType: 1,
      filePath: 1,
      fileSize: 1,
    },
  );
  if (docs.length) {
    for (const doc of docs) {
      if (doc.fileType == "image/jpeg" || doc.fileType == "image/png") {
        const thumbs = await saveThumbnails(doc.filePath);
        doc.fileSize += thumbs.size;
        await doc.save();
      }
      // update size details
      await Tenant.updateOne(
        { _id: doc.tenantId },
        { $inc: { actualSize: doc.fileSize, allLayerFileSize: doc.fileSize } },
      );
      await Layer.updateOne(
        { _id: doc.layerId },
        { $inc: { fileSize: doc.fileSize } },
      );
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
};

export const addIsReviewToLayerFiles = async (
  req: Request,
  res: AuthResponse,
) => {
  const layerFileDoc = await layerFiles.updateMany(
    {
      tenantId: res.locals.user.tenantId,
    },
    {
      isReview: true,
    },
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
};

export const deleteMultipleLayersFiles = async (
  req: Request,
  res: AuthResponse,
) => {
  const layerFileDocs = await layerFiles.find({
    tenantId: res.locals.user.tenantId._id,
    _id: { $in: req.body.layerFileIds },
  });
  for (const f of layerFileDocs) {
    await f.delete();
  }
  res.status(200).json({
    status: true,
    message: "LayerFiles successfully deleted",
    data: layerFileDocs,
  });
};

export const picktoMapUseForLayerCreate = async (
  req: Request,
  res: AuthResponse,
) => {
  const fileDocs = await UploadTask.find({
    _id: { $in: req.body.file },
    tenant: res.locals.user.tenantId._id,
    createdBy: res.locals.user._id,
    // status: "started",
  });
  if (!fileDocs) {
    res.status(404).json({
      status: false,
      message: "Oops files not found",
    });
    return;
  }
  const features: Feature<
    Point,
    {
      id: string;
      filename: string;
      color: string;
      icon: string;
      lat: string;
      long: string;
      date: string;
      time: string;
      sys_id: string;
    }
  >[] = [];
  const allImageData: {
    taskId: string;
    originalname: string;
    sys_id: string;
    mimetype: string;
    path: string;
    coordinates: turf.Position;
    size: number;
  }[] = [];
  const badImages: any = [];
  const today = new Date();
  const snapRadius = 60; // meters
  for (let i = 0; i < fileDocs.length; i++) {
    const buff = await readToBuffer(fileDocs[i].metadata.objectkey);
    const ff: any = await exifr.parse(buff);
    if (ff) {
      const time: any =
        today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
      const date: any =
        today.getFullYear() +
        "-" +
        (today.getMonth() + 1) +
        "-" +
        today.getDate();
      const long: number = ff.longitude ? ff.longitude : 0;
      const lat: number = ff.latitude ? ff.latitude : 0;
      let sys_id = new ObjectId().toString();

      // check if image location already exists
      const imagePoint = turf.point([long, lat]);
      let alreadyRegistered = false;
      for (const feature of features) {
        const featurePoint = turf.point(feature.geometry.coordinates);
        const distance =
          turf.distance(imagePoint, featurePoint, { units: "kilometers" }) *
          1000;
        if (distance < snapRadius) {
          // if image exists, share sys_id
          sys_id = feature.properties.sys_id;
          alreadyRegistered = true;
          break;
        }
      }
      allImageData.push({
        originalname: fileDocs[i].metadata.originalName,
        sys_id: sys_id,
        mimetype: fileDocs[i].metadata.mimetype,
        path: fileDocs[i].metadata.objectkey,
        coordinates: [long, lat],
        size: fileDocs[i].metadata.filesize,
        taskId: fileDocs[i]._id.toString(),
      });
      if (alreadyRegistered) {
        continue;
      }
      features.push({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [long, lat],
        },
        properties: {
          id: String(i + 1),
          filename: fileDocs[i].metadata.originalName,
          color: req.body.color || "green",
          icon: req.body.icon || "MarkerIcon",
          lat: String(lat),
          long: String(long),
          date: String(date),
          time: String(time),
          sys_id: sys_id,
        },
      });
    } else {
      await deletePublicFileUsingPath(fileDocs[i].metadata.objectkey);
      badImages.push(basename(fileDocs[i].metadata.objectkey));
      await fileDocs[i].delete();
    }
  }
  if (features.length) {
    const geojson = {
      type: req.body.type || "FeatureCollection",
      name: req.body.name || "PicToMap",
      features: features,
    };
    // @ts-ignore
    const result = await saveGeojson(geojson);
    const docCount = await Tenant.findOne({
      _id: res.locals.user.tenantId,
    })
      .populate<{ activePackage: IPackage }>("activePackage")
      .lean();

    const ress =
      docCount.activePackage.storage - Number(docCount.actualSize) >
      result.size;
    if (ress !== true) {
      for (const imageData of allImageData) {
        await deletePublicFileUsingPath(imageData.path);
        await UploadTask.findByIdAndDelete(imageData.taskId);
      }
      return res.status(403).json({
        status: false,
        message: "Actual storage exceeded the Limit of Set storage!",
      });
    }

    const savedDoc1 = await new Layer({
      name: req.body.missionId ? req.body.name : "Base - " + req.body.name,
      type: "Vector",
      vector: req.body.vectorType,
      tenantId: res.locals.user.tenantId._id,
      createdBy: res.locals.user._id,
      updatedBy: res.locals.user._id,
      color: req.body.color,
      fileSize: result.size,
      layerpath: result.geojsonPath,
      layerLabel: "sys_id",
      captureDate: new Date(),
      featureCount: features.length,
      isBase: !req.body.missionId,
      missionId: req.body.missionId ?? null,
    }).create();

    if (savedDoc1) {
      let flag = false;
      for (const imageData of allImageData) {
        const centerPoints2 = {
          lng: imageData.coordinates[0],
          lat: imageData.coordinates[1],
        };
        const filePath = await permPath(
          Directory.GEOJSON_IMAGES,
          imageData.path,
        );
        const featureFile = new layerFiles({
          name: imageData.originalname,
          layerId: savedDoc1._id,
          filePath: filePath,
          fileSize: imageData.size,
          featureLabel: imageData.sys_id,
          centerPoints: centerPoints2,
          fileType: imageData.mimetype,
          sys_Id: imageData.sys_id,
          isReview: true,
          tenantId: res.locals.user.tenantId,
          createdBy: res.locals.user._id,
          updatedBy: res.locals.user._id,
        });
        const savedDoc = await featureFile.create();
        await UploadTask.findByIdAndDelete(imageData.taskId);
        if (savedDoc) flag = true;
      }
      if (flag) {
        req.log.info("successfully created layer from images:", savedDoc1.name);
        const data = { badImages, result: savedDoc1 };
        missionSpecificSocket
          .to(String(savedDoc1.missionId))
          .emit("pic-to-map", data);
      } else {
        req.log.info("failed to create layer from images:", savedDoc1.name);
        const data = { badImages };
        missionSpecificSocket
          .to(String(savedDoc1.missionId))
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
};

// what is this even for?
export const sys_id_Inject = async (req: Request, res: AuthResponse) => {
  const docs = await Layer.find(
    {
      type: "Vector",
      tenantId: res.locals.user.tenantId,
    },
    {
      layerpath: 1,
      isPublic: 1,
    },
    {
      lean: true,
    },
  );
  if (docs.length) {
    for (const layer of docs) {
      const docpath = DirPath(Directory.ROOT, layer.layerpath);
      const geoJSON = await readGeoJson(docpath);
      if (geoJSON) {
        const { filepath: newPath, size } = await modGeoJson(
          null,
          null,
          geoJSON,
          docpath,
        );
        if (layer.isPublic) {
          // for public layer, re-generate search index after feature editing
          await saveFeatureSearchIndex(newPath); // save new search index
          await deleteFeatureSearchIndex(layer.layerpath); // delete old search index
        }
        await layer.updateFile(newPath, size);
      } else {
        req.log.warn("Geojson Not found");
      }
    }
    res.send("Ok");
  }
};

export const sys_id_Inject_to_layerfiles = async (
  req: Request,
  res: AuthResponse,
) => {
  const docs = await Layer.findOne(
    {
      _id: req.query.layerId,
      tenantId: res.locals.user.tenantId._id,
      type: "Vector",
    },
    {
      layerpath: 1,
      layerLabel: 1,
      missionId: 1,
      isPublic: 1,
    },
  );
  if (docs) {
    if (docs.missionId) {
      const p = DirPath(Directory.ROOT, docs.layerpath);
      const gjson = await readGeoJson(p);

      if (gjson == null) {
        return res.json({
          status: false,
          message: "file path not exist! ",
        });
      }

      const { filepath: newPath, size } = await modGeoJson(
        null,
        null,
        gjson,
        p,
      ); // add sys_ids to geojson

      if (docs.isPublic) {
        // for public layer, re-generate search index after feature editing
        await saveFeatureSearchIndex(newPath); // save new search index
        await deleteFeatureSearchIndex(docs.layerpath); // delete old search index
      }

      await docs.updateFile(newPath, size);

      if (newPath) {
        // update new sys_ids in layerfiles
        const modifiedGjson = await readGeoJson(
          DirPath(Directory.ROOT, newPath),
        );
        for (const feature of modifiedGjson.features) {
          await layerFiles.updateMany(
            {
              layerId: docs._id,
              featureLabel: feature.properties[docs.layerLabel],
            },
            { sys_Id: feature.properties.sys_id },
          );
          req.log.info("Modified Doc");
        }
      }

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
};

export const flagFeature = async (
  req: Request<{
    layerID: Types.ObjectId;
  }, {}, {
    flag: boolean;
    featureIndex: number[];
  }>,
  res: AuthResponse,
) => {
  const doc = await Layer.findOne({
    tenantId: res.locals.user.tenantId._id,
    _id: req.params.layerID,
  });
  if (doc) {
    doc.flaggedFeatures = doc.flaggedFeatures.filter(
      (f) => !req.body.featureIndex.includes(f),
    ); // both deletion and duplicate entry handled
    if (req.body.flag) doc.flaggedFeatures.push(...req.body.featureIndex);

    if (doc.flaggedFeatures.length === 0) doc.isFlagged = false;
    await doc.save();
    res.status(200).json({
      status: true,
      message: `feature ${
        req.body.flag ? "flagged" : "unflagged"
      } successfully`,
    });
  } else {
    res.status(404).json({
      status: false,
      message: "feature flagging failed",
    });
  }
};

export const flagLayer = async (
  req: Request<{ layerID: Types.ObjectId }>,
  res: AuthResponse,
) => {
  const doc = await Layer.findOne({
    tenantId: res.locals.user.tenantId._id,
    _id: req.params.layerID,
  });
  if (doc) {
    doc.isFlagged = req.body.flag as boolean;
    if (req.body.flag === false) doc.flaggedFeatures = [];
    await doc.save();
    res.status(200).json({
      status: true,
      message: "layer flagged successfully",
    });
  } else {
    res.status(404).json({
      status: false,
      message: "layer flagging failed",
    });
  }
};

export const publicLayerByMissionId = async (
  req: Request,
  res: AuthResponse,
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

  const layers = await Layer.find({ missionId: publicMission._id }).populate<{
    tenantId: ITenant;
  }>("tenantId", "name");
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
    },
  );
  res.json({
    status: true,
    message: "found mission and layers",
    centerPoints: flight.centerPoints,
    mission: publicMission,
    data: layers,
  });
};
