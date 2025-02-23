import { Request } from "express";
import * as pathUtils from "../../utils/pathUtils";
import Layer from "../../models/layer";
import fetch from "node-fetch";
import { AuthResponse } from "../../utils/interfaceUtils";
import { Feature, readGeoJson } from "../../utils/geojsonUtils";
import Tenant from "../../models/tenant";

import { subDays, subMonths, subWeeks, subYears, format } from "date-fns";
import { deleteDirFileUsingName } from "../../utils/fileDeleteUtils";
import { ObjectId } from "bson";
import layerFiles from "../../models/layerFiles";
import { featureType, vectorProps } from "../../schemas/vectorprops";
import { IMission } from "../../schemas/mission";
import { rasterProps } from "../../schemas/rasterprops";
import { IPackage } from "../../schemas/package";
import { ITenant } from "../../schemas/tenant";
import mongoose from "mongoose";
import {
  Directory,
  DirPath,
  TITILER_SERVER,
  TITILER_STATIC,
} from "../../constants";
import Alert from "../../models/alert";
import VOD from "../../models/vod";
import {
  permPath,
  saveFile,
  saveFeatureSearchIndex,
  saveGeojson,
  saveMultiGeojson,
  saveVectorLayer,
  deleteFeatureSearchIndex,
} from "../../utils/dataUtils";
import { LazToTiles3D } from "../../utils/pointcloud";
import UploadTask from "../../models/uploadTask";
import { randomUUID } from "crypto";

interface MissionMapVal {
  missionId: mongoose.Types.ObjectId;
  missionName: string;
  layers: [
    {
      _id: mongoose.Types.ObjectId;
      name: string;
      fields: string[];
    }
  ];
}
interface AttrMapVal {
  key: string;
  value: unknown;
  layerMatches: [
    {
      layerId: mongoose.Types.ObjectId;
      layerName: string;
      missionName: string;
    }
  ];
}
export const getMetadataForBaseLayer = async (
  req: Request,
  res: AuthResponse
) => {
  const data = await Layer.find(
    {
      _id: { $in: req.body.layers },
      tenantId: res.locals.user.tenantId._id,
    },
    {
      name: 1,
      layerpath: 1,
      mission: 1,
      missionId: 1,
      vector: 1,
    }
  ).populate<{ missionId: IMission }>("missionId");

  if (data.length !== req.body.layers.length) {
    res.json({
      success: false,
      message: "Some Layers Not Found",
    });
  } else {
    const layerTypes = new Set();

    data.forEach((element) => {
      layerTypes.add(featureType[element.vector]);
    });

    if (layerTypes.size > 1) {
      return res.json({
        success: false,
        data: Array.from(layerTypes.values()),
        message: "Only one type of layers can be mapped",
      });
    }

    const allAttributes = new Map<string, number>();
    const layerGeojson = await Promise.all(
      data.map(async (layer) => {
        const properties = Object.keys(
          (await readGeoJson(DirPath(Directory.ROOT, layer.layerpath)))
            .features[0]?.properties
        );
        properties.forEach((key) => {
          allAttributes.set(
            key,
            allAttributes.get(key) ? allAttributes.get(key) + 1 : 1
          );
        });
        return {
          _id: layer._id.toString(),
          name: layer.name,
          mission: layer.missionId.name,
          missionId: layer.missionId._id.toString(),
          properties,
        };
      })
    );

    const response: {
      missionId: string;
      missionName: string;
      layers: {
        _id: string;
        name: string;
        fields: {
          key: string;
          layerMatches: string;
        }[];
      }[];
    }[] = [];

    layerGeojson.forEach((layer) => {
      const mission = response.find(
        (res) => res.missionId == layer.missionId
      );
      const minLayer = {
        _id: layer._id,
        name: layer.name,
        fields: layer.properties.map((key) => ({
          key,
          layerMatches:
            allAttributes.get(key) === layerGeojson.length
              ? "Matches With All"
              : "No Other Matches",
        })),
      };
      if (mission) mission.layers.push(minLayer);
      else
        response.push({
          missionId: layer.missionId,
          missionName: layer.mission,
          layers: [minLayer],
        });
    });

    res.json({
      status: true,
      data: response,
      message: "got the right stuff",
    });
  }
};

// Create Base Layer
export const createVectorBaseLayer = async (
  req: Request,
  res: AuthResponse
) => {
  let geojsonPath: string;
  let size: number;
  let featureCount: number;
  let flagColor: string;
  let properties: Record<string, any>;
  const fileDoc = await UploadTask.findOne({
    _id: req.body.file,
    tenant: res.locals.user.tenantId._id,
    createdBy: res.locals.user._id,
    // status: "started",
  });
  try {
    const vectorLayer = await saveVectorLayer(fileDoc.metadata.objectkey, {
      icon: req.body.icon,
      color: req.body.color,
      inheritColor: req.body.inHeritOriginalColorFromFile,
    });

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
    properties = vectorLayer.properties;
  } catch (error) {
    req.log.error(error, "vector layer conversion failed");

    res.status(500).json({
      status: false,
      message: "file conversion failed",
    });
    return;
  }

  req.log.info("File successfully converted!");
  const { name, vector, captureDate } = req.body;

  const layer = new Layer({
    name: name,
    type: "Vector",
    vector,
    color: flagColor,
    layerpath: geojsonPath,
    fileSize: size,
    featureCount,
    captureDate,
    tenantId: res.locals.user.tenantId,
    createdBy: res.locals.user._id,
    updatedBy: res.locals.user._id,
    isBase: true,
  });
  const savedDoc = await layer.create();
  await fileDoc.delete();
  res.status(201).json({
    status: true,
    message: "New Layer Created",
    data: {
      layer: savedDoc,
      properties,
    },
  });
};

export const setPrimeAttributes = async (req: Request, res: AuthResponse) => {
  const doc = await Layer.findOne({
    _id: req.body.id,
    tenantId: res.locals.user.tenantId._id,
  });
  if (!doc) {
    res.status(404).json({
      success: false,
      message: "layer does not exist",
    });
  }
  const clonedGeojson = await saveGeojson(req.body.path, {
    filter: [...req.body.pattr, "color", "icon", "sys_id"],
  });

  await doc.updateFile(clonedGeojson.geojsonPath, clonedGeojson.size);

  res.json({
    success: true,
    message: "Prime attributes added successfully",
    data: doc,
  });
};

export const createBaseLayerByAttr = async (
  req: Request<
    unknown,
    unknown,
    {
      layers: {
        attrMapping: Record<string, string>;
        layerId: string;
      }[];
      color: string;
      name: string;
      pattr: {
        attribute: string;
        key: number;
        occurs: "Present in all layers";
      }[];
      vectorType: vectorProps;
    }
  >,
  res: AuthResponse
) => {
  if (req.body.layers) {
    const ids = req.body.layers.map((l) => l.layerId);

    const data = await Layer.find({
      _id: { $in: ids },
      tenantId: res.locals.user.tenantId._id,
    }).populate<{ missionId: IMission }>("missionId");

    const color =
      req.body.color && req.body.color.length > 0 ? req.body.color : "#000000";

    const clonedGeojson = await saveMultiGeojson(
      data.map((d) => ({
        path: d.layerpath,
        map: req.body.layers.find((l) => l.layerId == d._id.toString())
          .attrMapping,
      })),
      {
        filter: [
          ...req.body.pattr.map((attr) => attr.attribute),
          "color",
          "icon",
          "sys_id",
        ],
        name: req.body.name,
        color,
      }
    );

    const vectorLayer = new Layer({
      name: req.body.name,
      type: "Vector",
      vector: req.body.vectorType,
      tenantId: res.locals.user.tenantId._id,
      createdBy: res.locals.user._id,
      updatedBy: res.locals.user._id,
      layers: ids,
      color: color,
      fileSize: clonedGeojson.size,
      layerpath: clonedGeojson.path,
      captureDate: new Date(),
      featureCount: clonedGeojson.featureCount,
      isBase: true,
    });

    if (vectorLayer) {
      const savedDoc = await vectorLayer.create();
      await layerFiles.updateMany(
        { layerId: { $in: ids } },
        { $push: { layers: savedDoc._id } }
      );
      return res.status(201).json({
        status: true,
        message: "Sucessfully created base layer",
        data: savedDoc,
      });
    } else {
      return res.status(500).json({
        status: false,
        message: "Failed to create vector layer",
      });
    }
  }
};

export const filterBaseLayer = async (req: Request, res: AuthResponse) => {
  const sort: any = {};
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
  let startTime: any;
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
      startTime = format(endTime, "2020-01-01");
      break;
  }
  let d: any = [];
  const match: any = {};
  const match2: any = {};
  const match3: any = {};
  match.name = req.body.rasterProps;
  match2.name = req.body.vectorProps;
  match3.type = req.body.vectorPropsType;
  if (
    !req.body.vectorPropsType &&
    !req.body.vectorProps &&
    !req.body.rasterProps &&
    !req.body.type
  ) {
    d = await Layer.find({
      missionId: { $exists: false },
      createdAt: {
        $gte: startTime,
        $lte: endTime,
      },
      $or: [{ vector: { $exists: true } }, { raster: { $exists: true } }],
    })
      .sort(sort)
      .exec();
    if (!d.length)
      return res.json({
        status: false,
        message: "Data doesn't exist!",
      });
  }
  if (req.body.vectorPropsType) {
    const result = await Layer.find({
      type: "Vector",
      missionId: { $exists: false },
      createdAt: {
        $gte: startTime,
        $lte: endTime,
      },
      vector: { $exists: true },
    }).sort(sort);
    // Scope for optimization:
    // The below for loop could be completely removed and lesser docs would be read if we could use { vector: { $in: match3.type } },
    // but we can't as initially vector is just an id before populate() is done
    for (const layer of result) {
      for (const t of match3.type) {
        if (featureType[layer.vector] == t) {
          d.push(layer);
        }
      }
    }
  }
  if (req.body.vectorProps) {
    const result = await Layer.find({
      type: "Vector",
      missionId: { $exists: false },
      createdAt: {
        $gte: startTime,
        $lte: endTime,
      },
      vector: { $exists: true },
    }).sort(sort);
    for (const layer of result) {
      for (const name of match2.name) {
        if (layer.vector == name) {
          d.push(layer);
        }
      }
    }
  }
  if (req.body.rasterProps) {
    const result = await Layer.find({
      type: "Raster",
      missionId: { $exists: false },
      createdAt: {
        $gte: startTime,
        $lte: endTime,
      },
      raster: { $exists: true },
    }).sort(sort);
    for (const layer of result) {
      for (const name of match.name) {
        if (layer.raster == name) {
          d.push(layer);
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
};

export const getMetadataForUpdatingBaseLayer = async (
  req: Request,
  res: AuthResponse
) => {
  const data = await Layer.find(
    {
      _id: { $in: req.body.layers },
      vector: { $exists: true },
    },
    {
      name: 1,
      layerpath: 1,
      mission: 1,
      missionId: 1,
      vector: 1,
    }
  ).populate<{ missionId: IMission }>("missionId");

  const baseLayerData = await Layer.findOne(
    {
      _id: req.body.baseLayer,
      vector: { $exists: true },
      isBase: true,
    },
    {
      vector: 1,
      layerpath: 1,
    }
  );

  if (!baseLayerData) throw new Error("baseLayer data is null");

  if (data.length !== req.body.layers.length) {
    return res.json({
      success: false,
      message: "Some Layers Not Found",
    });
  } else {
    const layerTypes = new Set();
    data.forEach((element) => {
      layerTypes.add(featureType[element.vector]);
    });

    if (layerTypes.size > 1) {
      return res.json({
        success: false,
        data: Array.from(layerTypes.values()),
        message: "Only one type of layers can be mapped",
      });
    } else if (!layerTypes.has(featureType[baseLayerData.vector])) {
      return res.json({
        success: false,
        message:
          "Vector type of base layer is different than selected layers",
      });
    }

    const layerData = data.map((layer) => {
      return {
        _id: layer._id,
        name: layer.name,
        layerpath: layer.layerpath,
        mission: layer.missionId.name,
        missionId: layer.missionId._id,
      };
    });

    const missionMap: Map<string, MissionMapVal> = new Map();
    const attrMap: Map<string, AttrMapVal> = new Map();

    const bgjson = await readGeoJson(
      DirPath(Directory.ROOT, baseLayerData.layerpath)
    );
    const bfeaure = bgjson.features[0];
    const pattr: any = [];
    for (const [attr, _] of Object.entries<any>(bfeaure.properties)) {
      if (attr !== "Nth") {
        pattr.push(attr);
      }
    }

    for (const layer of layerData) {
      const gjson = await readGeoJson(
        DirPath(Directory.ROOT, layer.layerpath)
      );
      const feature = gjson.features[0];

      if (missionMap.get(layer.missionId.toString())) {
        missionMap.get(layer.missionId.toString()).layers.push({
          _id: layer._id,
          name: layer.name,
          fields: [],
        });
      } else {
        missionMap.set(layer.missionId.toString(), {
          missionId: layer.missionId,
          missionName: layer.mission,
          layers: [
            {
              _id: layer._id,
              name: layer.name,
              fields: [],
            },
          ],
        });
      }

      for (const p of Object.entries(feature.properties)) {
        missionMap
          .get(layer.missionId.toString())
          .layers[
            missionMap.get(layer.missionId.toString()).layers.length - 1
          ].fields.push(p[0]);
        if (attrMap.get(p[0])) {
          attrMap.get(p[0]).layerMatches.push({
            layerId: layer._id,
            layerName: layer.name,
            missionName: layer.mission,
          });
        } else {
          attrMap.set(p[0], {
            key: p[0],
            value: p[1],
            layerMatches: [
              {
                layerId: layer._id,
                layerName: layer.name,
                missionName: layer.mission,
              },
            ],
          });
        }
      }
    }

    const response: any = [];

    for (const [_, missionData] of missionMap.entries()) {
      response.push({
        ...missionData,
        layers: missionData.layers.map((layer) => {
          return {
            ...layer,
            fields: layer.fields.map((f) => {
              const lm = attrMap
                .get(f)
                .layerMatches.filter(
                  (l) => l.layerId.toString() !== layer._id.toString()
                );
              let layerMatches;
              if (lm.length === 0) layerMatches = "No Other Mathces";
              else if (lm.length === layerData.length - 1) layerMatches = "Matches With All";
              else layerMatches = lm;
              return {
                ...attrMap.get(f),
                layerMatches
              };
            }),
          };
        }),
      });
    }

    res.json({
      status: true,
      message: "got the data",
      data: {
        pAttr: pattr,
        layerAttr: response,
      },
    });
  }
};

export const updateBaseLayerByAttr = async (
  req: Request,
  res: AuthResponse
) => {
  const baseLayer = await Layer.findOne(
    {
      _id: req.body.baseLayer,
      vector: { $exists: true },
      isBase: true,
    },
    {
      layerpath: 1,
      vector: 1,
      fileSize: 1,
    }
  );

  if (!baseLayer) throw new Error("baseLayer is null or undefined");

  if (req.body.layers) {
    const layerData = await Layer.find(
      {
        _id: { $in: req.body.layers },
        vector: { $exists: true },
      },
      {
        layerpath: 1,
        vector: 1,
      }
    ).populate<{ missionId: IMission }>("missionId");

    for (const d of layerData) {
      if (featureType[d.vector] !== featureType[baseLayer.vector]) {
        return res.json({
          success: false,
          message: "Layer type must be same as base layer",
        });
      }
    }

    const layers = layerData.map((layer) => ({
      path: layer.layerpath,
      map: req.body.layers.find(
        (l) => l.layerId.toString() === layer._id.toString()
      ).attrMapping,
    }));
    const clonedGeojson = await saveMultiGeojson(layers, {
      color: baseLayer.color,
    });

    const layerIds = layerData.map((layer) => layer._id);

    baseLayer.featureCount = clonedGeojson.featureCount;
    baseLayer.layers = [...baseLayer.layers, ...layerIds];
    await baseLayer.save();

    await baseLayer.updateFile(clonedGeojson.path, clonedGeojson.size);

    res.json({
      success: true,
      message: "Layer updated successfully",
      data: baseLayer,
    });
  }
};

export const getBaseLayers = async (req: Request, res: AuthResponse) => {
  const { type } = req.params;
  if ((type !== "Vector" && type !== "Raster" && type !== "All") || !type) {
    return res.json({
      success: false,
      message: "Please provide a valid type",
    });
  }
  const data = await Layer.find({
    [type !== "All" && "type"]: type,
    isBase: true,
    tenantId: res.locals.user.tenantId._id,
  });

  res.status(200).json({
    success: true,
    message: "BaseLayers fetched successfully",
    data: data,
  });
};

// Create Base Layer
export const uploadLayerToUpdateBaseLayer = async (
  req: Request,
  res: AuthResponse
) => {
  const fileDoc = await UploadTask.findOne({
    _id: req.body.file,
    tenant: res.locals.user.tenantId._id,
    createdBy: res.locals.user._id,
    // status: "started",
  });
  const geojson = await readGeoJson(fileDoc.metadata.objectkey);

  if (geojson == null) {
    return res.json({
      status: false,
      message: "file path not exist! ",
    });
  }

  const baseLayer = await Layer.findOne(
    {
      _id: req.body.baseLayer,
    },
    {
      layerpath: 1,
    }
  );

  if (!baseLayer) {
    res.status(404).json({
      status: false,
      message: "BaseLayer not found",
    });
    return;
  }

  const bgjson = await readGeoJson(baseLayer.layerpath);

  if (bgjson == null) {
    return res.json({
      status: false,
      message: "file path not exist! ",
    });
  }

  if (
    geojson.features[0].geometry.type !== bgjson.features[0].geometry.type
  ) {
    return res.status(400).json({
      success: false,
      message: "The file must be of same type as base layer",
    });
  }

  const pattr: any = [];

  for (const [attr] of Object.entries<any>(geojson.features[0].properties)) {
    if (attr !== "Nth") {
      pattr.push(attr);
    }
  }

  const layerAttr: any = [];

  for (const [attr, val] of Object.entries<any>(
    geojson.features[0].properties
  )) {
    layerAttr.push({
      attr: attr,
      value: val,
    });
  }

  // updating the geojson of baselayer to the one uploaded
  const fullPath = await permPath(
    Directory.VECTOR,
    fileDoc.metadata.objectkey
  );
  const size = fileDoc.metadata.filesize;
  await baseLayer.updateFile(fullPath, size);
  await fileDoc.delete();

  res.json({
    success: true,
    data: {
      primeAttributes: pattr,
      layerAttributes: layerAttr,
      filePath: fullPath,
      baseLayer: req.body.baseLayer,
    },
  });
};

// Create Base Layer
export const updateBaseLayerByUploadedFile = async (
  req: Request,
  res: AuthResponse
) => {
  const objectKey = req.body.filePath;

  const geojson = await readGeoJson(objectKey);

  if (geojson == null) {
    return res.json({
      status: false,
      message: "file path not exist! ",
    });
  }

  const baseLayer = await Layer.findOne(
    {
      _id: req.body.baseLayer,
    },
    {
      layerpath: 1,
      fileSize: 1,
    }
  );

  if (!baseLayer) {
    res.status(404).json({
      status: false,
      message: "baselayer is null",
    });
    return;
  }

  const bgjson = await readGeoJson(baseLayer.layerpath);

  if (bgjson == null) {
    return res.json({
      status: false,
      message: "file path not exist! ",
    });
  }

  const color = bgjson.features[0].properties.color;
  const icon = bgjson.features[0].properties.icon;

  const features = geojson.features;

  const newFeatures: Feature[] = [];

  for (const f of features) {
    let feature = {
      ...f,
    };
    const properties = {
      ...f.properties,
    };

    const pattributes: any = {};

    const sys_id = new ObjectId();
    pattributes.sys_id = sys_id.toHexString();

    for (const [attr, m] of Object.entries<any>(req.body.attrMapping)) {
      pattributes[attr] = properties[m] ? properties[m] : "null";
    }

    feature = {
      ...feature,
      properties: {
        ...pattributes,
        color,
        icon,
        Nth: {
          ...properties,
        },
      },
    };

    newFeatures.push(feature);
  }

  bgjson.features = [...bgjson.features, ...newFeatures];

  const dataString = JSON.stringify(bgjson);
  const layername = randomUUID() + ".geojson";
  let { size } = await saveFile(Directory.VECTOR, layername, dataString);
  size = size / (1024 * 1024);

  const docCount = await Tenant.findById(
    res.locals.user.tenantId._id
      ? res.locals.user.tenantId._id
      : res.locals.user.tenantId,
    {
      activePackage: 1,
      actualSize: 1,
    }
  )
    .populate<{ activePackage: IPackage }>("activePackage")
    .lean();

  const prevSize = Number(docCount.actualSize);
  const newSize = prevSize - Number(baseLayer.fileSize) + size;

  if (docCount.storageUsed + newSize > docCount.activePackage.storage) {
    return res.status(403).json({
      status: false,
      message: "Actual storage exceeded the Limit of Set storage!",
    });
  }

  baseLayer.featureCount = bgjson.features.length;
  await baseLayer.save();

  const newPath = pathUtils.docPath(Directory.VECTOR, layername);

  if (baseLayer.isPublic) {
    // for public layer, re-generate search index after feature editing
    await saveFeatureSearchIndex(newPath);
    await deleteFeatureSearchIndex(baseLayer.layerpath);
  }

  const updatedBaseLayer = await baseLayer.updateFile(newPath, size);
  await deleteDirFileUsingName(Directory.ROOT, req.body.filePath);
  res.json({
    success: true,
    message: "Layer has been updated successfully",
    data: updatedBaseLayer,
  });
};

const flattenObj = (ob: {
  [x: string]: any;
  SL_NO?: number;
  AA?: string;
  Solar_ID?: string;
  Placed_IN?: string;
  Latitude?: number;
  Longitude?: number;
  DoC?: string;
  Phase?: string;
  color?: string;
  icon?: string;
  sys_id?: string;
  Nth?: any;
}) => {
  const result: any = {};
  for (const i in ob) {
    if (typeof ob[i] === "object" && !Array.isArray(ob[i])) {
      const temp = flattenObj(ob[i]);
      for (const j in temp) {
        result[j] = temp[j];
      }
    } else {
      result[i] = ob[i];
    }
  }
  return result;
};

export const createBaseRasterfromMission = async (
  req: Request,
  res: AuthResponse
) => {
  const layer = await Layer.findOne({
    _id: req.body.layers[0],
    tenantId: res.locals.user.tenantId._id,
    raster: { $exists: true },
  }).populate<{ missionId: IMission }>("missionId");

  if (!layer) {
    res.status(404).json({
      status: false,
      message: "layer not found",
    });
    return;
  }
  await layer.updateOne({ isBase: true, name: "Base - " + layer.name });

  res.status(201).json({
    status: true,
    message: "New Base Layer Created Successfully",
    data: layer,
  });
};

export const delete_baseLayer = async (req: Request, res: AuthResponse) => {
  const layers = await Layer.find({
    _id: { $in: req.body.layers },
    tenantId: res.locals.user.tenantId._id,
    isBase: true,
    isPublic: false,
  });

  if (layers.length == 0) {
    res.status(404).json({
      success: false,
      message: "no layers found",
    });
    return;
  }

  const results = await Promise.allSettled(
    layers.map(async (layer) => {
      if (layer.missionId) {
        // if layer was previously a mission layer before becoming a base layer
        // then convert it back to mission layer
        await layer.updateOne({
          isBase: false,
          name: layer.name.replace(/"Base - "/, ""),
        });
        return layer;
      }
      // otherwise delete it fully
      await layer.delete();
      return layer;
    })
  );

  res.json({
    success: true,
    message: "layers deleted",
    data: layers.map((layer, i) => ({
      _id: layer._id,
      deleted: results[i].status == "fulfilled",
    })),
  });
};

export const createBaseRasterfromUpload = async (
  req: Request,
  res: AuthResponse
) => {
  const fileDoc = await UploadTask.findOne({
    _id: req.body.file,
    tenant: res.locals.user.tenantId._id,
    createdBy: res.locals.user._id,
    status: "started",
  });

  //----------TITILER API HAS CHANGED-------------------
  //  Metadata api has been removed
  // instead there is statistics api and info api
  let minP = 0;
  let maxP = 1;
  const { name, raster, captureDate } = req.body;
  const rasterType = raster as rasterProps;
  if (!Object.values(rasterProps).includes(rasterType)) {
    res.status(404).json({
      status: false,
      message: "raster type not found",
    });
    return;
  }
  let center = { lat: 0, lng: 0 };
  let metadata = {};
  if (rasterType == rasterProps.DEM) {
    let metaDataURL = `${TITILER_SERVER}/cog/statistics?url=${TITILER_STATIC}/${fileDoc.metadata.objectkey}`;
    let response = await fetch(metaDataURL, {
      method: "GET",
    });
    let metadata = await response.json();
    //-------handle for detail:not found----
    minP = metadata["b1"]["min"];
    maxP = metadata["b1"]["max"];

    metaDataURL = `${TITILER_SERVER}/cog/info?url=${TITILER_STATIC}/${fileDoc.metadata.objectkey}`;
    response = await fetch(metaDataURL, {
      method: "GET",
    });
    metadata = await response.json();
    center = {
      lat: (metadata["bounds"][1] + metadata["bounds"][3]) / 2,
      lng: (metadata["bounds"][0] + metadata["bounds"][2]) / 2,
    };
  } else if (rasterType == rasterProps.POINT_CLOUD) {
    metadata = await LazToTiles3D(fileDoc.metadata.objectkey);
  }
  const newPath = await permPath(
    Directory.RASTER,
    fileDoc.metadata.objectkey
  );
  const layer = new Layer({
    name: `base - ${name}`,
    type: "Raster",
    raster: rasterType,
    captureDate,
    center,
    minp: minP,
    maxp: maxP,
    fileSize: fileDoc.metadata.filesize,
    tenantId: res.locals.user.tenantId,
    createdBy: res.locals.user._id,
    updatedBy: res.locals.user._id,
    metadata,
    isBase: true,
    layerpath: newPath,
  });
  const savedDoc = await layer.create();
  await fileDoc.delete();
  if (savedDoc) {
    res.status(201).json({
      status: true,
      message: "New Base Layer Created Successfully",
      data: savedDoc,
    });
  } else {
    res.status(500).json({
      status: false,
      message: "Failed to create base layer",
    });
  }
};

export const updateBaseLayerRasterUpload = async (
  req: Request,
  res: AuthResponse
) => {
  const fileDoc = await UploadTask.findOne({
    _id: req.body.file,
    tenant: res.locals.user.tenantId._id,
    createdBy: res.locals.user._id,
    status: "started",
  });
  const doc = await Layer.findOne({
    _id: req.body.layerId,
    tenantId: res.locals.user.tenantId._id,
    isBase: true,
    type: "Raster",
    raster: rasterProps.ORTHO,
  });
  if (!doc) {
    res.status(404).json({
      success: false,
      message: "compatible baselayer not found",
    });
    return;
  }

  //----------TITILER API HAS CHANGED-------------------
  //  Metadata api has been removed
  // instead there is statistics api and info api
  const metaDataURL = `${TITILER_SERVER}/cog/statistics?url=${TITILER_STATIC}${fileDoc.metadata.objectkey}`;
  const response = await fetch(metaDataURL, {
    method: "GET",
  });
  const metadata = await response.json();
  //-------handle for detail:not found----
  const minP = metadata["1"]["min"];
  const maxP = metadata["1"]["max"];
  doc.minp = minP;
  doc.maxp = maxP;
  await doc.save();
  const fullPath = await permPath(Directory.RASTER, fileDoc.metadata.objectkey);
  const size = fileDoc.metadata.filesize;
  const newDoc = await doc.updateFile(fullPath, size);
  await fileDoc.delete();
  if (newDoc) {
    res.status(200).json({
      status: true,
      message: "Raster layer updated sucessfully",
      data: newDoc,
    });
  } else {
    res.status(200).json({
      status: false,
      message: "Oops something went wrong",
    });
  }
};

export const updateBaseLayerRasterImport = async (
  req: Request,
  res: AuthResponse
) => {
  const doc = await Layer.findOne({
    _id: req.body.layerId,
    tenantId: res.locals.user.tenantId._id,
    raster: { $exists: true },
  });
  if (!doc) {
    res.status(404).json({
      success: false,
      message: "baselayer not found",
    });
    return;
  }
  const data = await Layer.findOne({
    _id: req.body.layers[0],
    tenantId: res.locals.user.tenantId._id,
    raster: { $exists: true },
    type: "Raster",
    isBase: false,
  });
  if (!data) {
    res.status(404).json({
      success: false,
      message: "mission layer not found or already baselayer",
    });
    return;
  }
  await data.updateOne({ isBase: true, name: "Base - " + data.name });
  if (doc.missionId == null) {
    await doc.delete();
  } else {
    await doc.updateOne({
      isBase: false,
      name: doc.name.replace(/"Base - "/, ""),
    });
  }

  res.status(200).json({
    status: true,
    message: "Raster layer updated sucessfully",
    data: data,
  });
};

export const isBaseupdateDev = async (req: Request, res: AuthResponse) => {
  const docs: any = await Layer.find(
    {
      tenantId: res.locals.user.tenantId,
    },
    {
      isBase: 1,
      missionId: 1,
      type: 1,
    }
  );
  if (docs.length) {
    for (const doc of docs) {
      if ((!doc.isBase) && doc.missionId != null) {
        doc.isBase = false;
        await Layer.updateOne(
          { _id: doc._id },
          { isBase: doc.isBase }
        );
      }
      if (
        (!doc.isBase) &&
        doc.missionId == null &&
        doc.type == "Vector"
      ) {
        doc.isBase = false;
        await Layer.updateOne(
          { _id: doc._id },
          { isBase: doc.isBase }
        );
      }
      if (
        (!doc.isBase) &&
        doc.missionId == null &&
        doc.type == "Raster"
      ) {
        doc.isBase = false;
        await Layer.updateOne(
          { _id: doc._id },
          { isBase: doc.isBase }
        );
      }
    }
    res.status(200).json({
      status: true,
      message: "All layer documents modified",
    });
  } else {
    res.status(200).json({
      status: false,
      message: "No layer documents found",
    });
  }
};

export const createBaseVectorLayer = async (
  req: Request,
  res: AuthResponse
) => {
  const vectorLayer = await saveVectorLayer(req.body.geoJSON, {
    inheritColor: true,
  });
  const layer = await new Layer({
    name: req.body.name,
    type: "Vector",
    vector: req.body.vectorType,
    missionId: null,
    tenantId: res.locals.user.tenantId._id,
    createdBy: res.locals.user._id,
    updatedBy: res.locals.user._id,
    color: vectorLayer.flagColor,
    fileSize: vectorLayer.size,
    layerpath: vectorLayer.geojsonPath,
    featureCount: vectorLayer.featureCount,
    captureDate: new Date(),
    isBase: true,
  }).create();

  if (layer) {
    res.status(201).json({
      status: true,
      message: "Sucessfully created base vector layer",
      data: layer,
    });
  } else {
    res.status(201).json({
      status: false,
      message: "Failed to create base vector layer",
    });
  }
};

export const publishBaseLayer = async (req: Request, res: AuthResponse) => {
  const doc = await Layer.findOne(
    {
      _id: req.body.layerId,
      tenantId: res.locals.user.tenantId,
    },
    {
      tenantId: 1,
      layerpath: 1,
      metadata: 1,
    }
  );
  const tenantDoc = await Tenant.findOne(
    {
      _id: res.locals.user.tenantId,
    },
    {
      publicMapRef: 1,
    }
  );
  if (doc) {
    const searchIndexPath = await saveFeatureSearchIndex(doc.layerpath);
    const metadata = { ...doc.metadata, searchIndexPath };
    if (tenantDoc.publicMapRef == null) {
      const randomString = new ObjectId();
      const unid = `${doc.tenantId}${randomString}`;
      await Tenant.updateOne(
        { _id: res.locals.user.tenantId },
        { publicMapRef: unid }
      );
    }
    await Layer.updateOne(
      { _id: req.body.layerId },
      { isPublic: true, metadata }
    );
    const getDoc = await Layer.findOne({ _id: req.body.layerId }).populate<{
      tenantId: ITenant;
    }>("tenantId");
    if (getDoc) {
      res.status(200).json({
        status: true,
        message: `Layer: ${req.body.layerId} has been made public`,
        publicMapRef: getDoc.tenantId.publicMapRef,
        data: getDoc,
      });
    } else {
      res.status(200).json({
        status: false,
        message: "Could not make base layer public",
      });
    }
  } else {
    res.status(200).json({
      status: false,
      message: "Oops no base layers found",
    });
  }
};

export const getallpublicbaselayer = async (
  req: Request,
  res: AuthResponse
) => {
  req.log.info(req.query.mapRef);
  const tenant = await Tenant.findOne(
    {
      publicMapRef: req.query.mapRef,
    },
    {
      _id: 1,
    }
  );
  const docs = await Layer.find({
    tenantId: tenant._id,
    isPublic: true,
    isBase: true,
  }).populate<{ tenantId: ITenant }>("tenantId", "name");
  if (req.query.mapRef) {
    if (docs.length) {
      res.status(200).json({
        status: true,
        message: "Fetched all public base layers",
        data: docs,
      });
    } else {
      res.status(404).json({
        status: false,
        message: "Oops! No map data found.",
      });
    }
  } else {
    res.status(404).json({
      status: false,
      message: "Please provide a map ref in order to fetch public layers",
    });
  }
};

export const isPublicupdateDev = async (req: Request, res: AuthResponse) => {
  const docs = await Layer.find(
    {
      tenantId: res.locals.user.tenantId,
    },
    {
      isPublic: 1,
      missionId: 1,
      publicMapRef: 1,
      type: 1,
    }
  );
  if (docs.length) {
    for (const doc of docs) {
      if ((!doc.isPublic) && doc.missionId != null) {
        doc.isPublic = false;
        doc.publicMapRef = null;
        await Layer.updateOne(
          { _id: doc._id },
          { isPublic: doc.isPublic, publicMapRef: doc.publicMapRef }
        );
      }
      if (
        (!doc.isPublic) &&
        doc.missionId == null &&
        doc.type == "Vector"
      ) {
        doc.isPublic = false;
        doc.publicMapRef = null;
        await Layer.updateOne(
          { _id: doc._id },
          { isPublic: doc.isPublic, publicMapRef: doc.publicMapRef }
        );
      }
      if (
        (!doc.isPublic) &&
        doc.missionId == null &&
        doc.type == "Raster"
      ) {
        doc.isPublic = false;
        doc.publicMapRef = null;
        await Layer.updateOne(
          { _id: doc._id },
          { isPublic: doc.isPublic, publicMapRef: doc.publicMapRef }
        );
      }
    }
    res.status(200).json({
      status: true,
      message: "All layer documents modified",
    });
  } else {
    res.status(200).json({
      status: false,
      message: "No layer documents found",
    });
  }
};

const getAlertLocationGeojson = async (
  tenantId: mongoose.Types.ObjectId,
  startDate: Date,
  endDate: Date
) => {
  const alerts = await Alert.find({
    tenantId,
    createdAt: { $gte: startDate, $lte: endDate },
    "location.lat": { $exists: true },
    "location.long": { $exists: true },
  });
  const geojson = {
    type: "FeatureCollection",
    name: "Images",
    crs: {
      type: "name",
      properties: {
        name: "urn:ogc:def:crs:OGC:1.3:CRS84",
      },
    },
    features: alerts.map((alert, index) => ({
      type: "Feature",
      properties: {
        _id: alert._id,
        Latitude: alert.location.lat,
        Longitude: alert.location.long,
        Name: alert.locationName,
        DoC: alert.createdAt.toLocaleDateString(),
        Remarks: alert.note,
        color: "#d0021b",
        icon: "MarkerIcon",
        LocationID: alert.locationId,
        Image: alert.image,
        isFlagged: alert.isFlagged,
      },
      geometry: {
        type: "Point",
        coordinates: [alert.location.long, alert.location.lat],
      },
    })),
  };
  return geojson;
};

export const GetAlertLocationGeojson = async (
  req: Request<{}, {}, {}, { startDate: Date; endDate: Date }>,
  res: AuthResponse
) => {
  const startDate = req.query.startDate;
  const endDate = req.query.endDate;
  const geojson = await getAlertLocationGeojson(
    res.locals.user.tenantId._id,
    startDate,
    endDate
  );
  res.json(geojson);
};

const getVideoLocationGeojson = async (
  tenantId: mongoose.Types.ObjectId,
  startDate: Date,
  endDate: Date
) => {
  const videos = await VOD.aggregate([
    {
      $match: {
        tenantId,
        createdAt: { $gte: startDate, $lte: endDate },
        locationID: { $exists: true, $ne: "undefined" },
      },
    },
    {
      $group: {
        _id: "$locationID",
        videos: {
          $push: {
            _id: "$_id",
            flightID: "$flightID",
            missionID: "$missionID",
            videoPath: "$videoPath",
            thumbnail: "$thumbnail",
            tenantId: "$tenantId",
            videoName: "$videoName",
            fileSize: "$fileSize",
            isSRT: "$isSRT",
            isFlagged: "$isFlagged",
            createdAt: "$createdAt",
            updatedAt: "$updatedAt",
          },
        },
      },
    },
    {
      $lookup: {
        from: "locations",
        localField: "_id",
        foreignField: "_id",
        as: "location",
      },
    },
    {
      $unwind: "$location",
    },
    {
      $project: {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [
            "$location.geometry.coordinates.lng",
            "$location.geometry.coordinates.lat",
          ],
        },
        properties: {
          videos: "$videos",
          name: "$location.properties.name",
          longitude: "$location.geometry.coordinates.lng",
          latitude: "$location.geometry.coordinates.lat",
          locationID: "$_id",
        },
      },
    },
  ]);
  const geojson = {
    type: "FeatureCollection",
    name: "Videos",
    crs: {
      type: "name",
      properties: {
        name: "urn:ogc:def:crs:OGC:1.3:CRS84",
      },
    },
    features: videos,
  };
  return geojson;
};

export const GetVideoLocationGeojson = async (
  req: Request<{}, {}, {}, { startDate: Date; endDate: Date }>,
  res: AuthResponse
) => {
  const startDate = req.query.startDate;
  const endDate = req.query.endDate;
  const geojson = await getVideoLocationGeojson(
    res.locals.user.tenantId._id,
    startDate,
    endDate
  );
  res.json(geojson);
};
