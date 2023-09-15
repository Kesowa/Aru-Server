import { Request } from "express";
import Layer from "../../models/layer";
import fetch from "node-fetch";
import path from "path";
import { AuthResponse } from "../../utils/interfaceUtils";
import { Feature, modGeoJson, readGeoJson } from "../../utils/geojsonUtils";
import Tenant from "../../models/tenant";
import fs from "fs";
import { isSizeVector } from "../../utils/sizePermission";

import { subDays, subMonths, subWeeks, subYears, format } from "date-fns";
import { deleteDirFileUsingName } from "../../utils/fileDeleteUtils";
import { ObjectId } from "bson";
import layerFiles from "../../models/layerFiles";
import { IVector } from "../../schemas/vectorprops";
import { IMission } from "../../schemas/mission";
import { IRaster } from "../../schemas/rasterprops";
import { IPackage } from "../../schemas/package";
import { ITenant } from "../../schemas/tenant";
import mongoose, { HydratedDocument } from "mongoose";
import {
  Directory,
  DirPath,
  TITILER_SERVER,
  TITILER_STATIC,
} from "../../constants";
import { getFileSize } from "../../utils/fileUtils";
import Alert from "../../models/alert";
import VOD from "../../models/vod";
import { ILayer } from "../../schemas/layer";
import kmlToGjson from "@mapbox/togeojson";
import shp2json from "shpjs";
import { DOMParser } from "xmldom";

interface missionMapVal {
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
interface attrMapVal {
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
  {
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
    )
      .populate<{ missionId: IMission }>("missionId")
      .populate<{ vector: IVector }>("vector");

    if (data.length !== req.body.layers.length) {
      res.json({
        success: false,
        message: "Some Layers Not Found",
      });
    } else {
      const layerTypes = new Set();

      data.forEach((element) => {
        layerTypes.add(element.vector.type);
      });

      if (layerTypes.size > 1) {
        return res.json({
          success: false,
          data: Array.from(layerTypes.values()),
          message: "Only one type of layers can be mapped",
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

      const missionMap: Map<string, missionMapVal> = new Map();
      const attrMap: Map<string, attrMapVal> = new Map();

      for (const layer of layerData) {
        const gjson = await readGeoJson(
          DirPath(Directory.DEFAULT, layer.layerpath)
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

      for (const [missionId, missionData] of Object.entries<any>(missionMap)) {
        response.push({
          ...missionData,
          layers: missionData.layers.map(
            (layer: { fields: any[]; _id: { toString: () => string } }) => {
              return {
                ...layer,
                fields: layer.fields.map((f: string) => {
                  const lm = attrMap
                    .get(f)
                    .layerMatches.filter(
                      (l) => l.layerId.toString() !== layer._id.toString()
                    );
                  return {
                    ...attrMap.get(f),
                    layerMatches:
                      lm.length === 0
                        ? "No Other Mathces"
                        : lm.length === layerData.length - 1
                        ? "Matches With All"
                        : lm,
                  };
                }),
              };
            }
          ),
        });
      }

      res.json({
        status: true,
        data: response,
        message: "got the right stuff",
      });
    }
  }
};

// Create Base Layer
export const createVectorBaseLayer = async (
  req: Request,
  res: AuthResponse
) => {
  {
    let layer: HydratedDocument<ILayer>;
    const fileExt = path.extname(req.file.filename);
    const filename = path.parse(req.file.filename).name + ".geojson";
    const dir = DirPath(Directory.VECTOR, filename);
    try {
      if (fileExt == ".kml") {
        const fileData = await fs.promises.readFile(req.file.path, "utf8");
        const kml1 = new DOMParser().parseFromString(fileData, "text/xml");
        const converted = kmlToGjson.kml(kml1, { styles: true });
        await fs.promises.writeFile(dir, JSON.stringify(converted));
        await fs.promises.rm(req.file.path);
      } else if (fileExt == ".shp" || fileExt == ".zip") {
        const fileData = await fs.promises.readFile(req.file.path);
        const geojson = await shp2json(fileData);
        await fs.promises.writeFile(dir, JSON.stringify(geojson));
        await fs.promises.rm(req.file.path);
      } else if (fileExt == ".geojson") {
        await fs.promises.rename(req.file.path, dir);
      } else {
        await fs.promises.rm(req.file.path);
        res.status(400).json({
          status: false,
          message: "vector format not supported!",
        });
        return;
      }
    } catch (err) {
      await fs.promises.rm(req.file.path);
      req.log.error(err, "file conversion failed");
      res.status(500).json({
        status: false,
        message: "file conversion failed",
      });
      return;
    }
    req.log.info("File successfully converted!");
    const { name, vector, captureDate, color } = req.body;

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
      const size: number = Number(
        (Number(req.file?.size) / (1024 * 1024)).toFixed(5)
      );
      layer = new Layer({
        name: name,
        type: "Vector",
        vector,
        color,
        layerpath: `/vector/${filename}`,
        fileSize: size,
        featureCount: fc,
        captureDate,
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
        const size: number = Number(
          (Number(req.file?.size) / (1024 * 1024)).toFixed(5)
        );
        layer = new Layer({
          name: name,
          type: "Vector",
          vector,
          color: flagColor,
          layerpath: `/vector/${filename}`,
          fileSize: size,
          featureCount: fc,
          captureDate,
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

    if (layer) {
      const savedDoc = await layer.save();

      if (savedDoc) {
        await Tenant.findOneAndUpdate(
          {
            _id: res.locals.user.tenantId,
            actualLayerCount: {
              $gte: 0,
            },
          },
          {
            $inc: {
              actualLayerCount: 1,
            },
          }
        );

        res.status(201).json({
          status: true,
          message: "New Layer Created",
          data: {
            layer: savedDoc,
            properties: {
              ...geojson.features[0].properties,
            },
          },
        });
      } else {
        res.json({
          status: false,
          message: "Layer not created",
        });
      }
    }
  }
};

type PropertyVals = Feature["properties"][keyof Feature["properties"]];
export const setPrimeAttributes = async (req: Request, res: AuthResponse) => {
  {
    const filepath: string = req.body.path;
    const pattr = new Set(req.body.pattr as string[]);

    const dir = DirPath(Directory.DEFAULT, filepath);
    const id = req.body.id;
    const geojson = await readGeoJson(dir);
    if (geojson == null) {
      return res.json({
        status: false,
        message: "file path not exist! ",
      });
    }

    pattr.add("color");
    pattr.add("icon");
    pattr.add("sys_id");

    const nfeatures = geojson.features.map((feature) => {
      const pattributes = new Map<string, PropertyVals>();
      const nattributes = new Map<string, PropertyVals>();
      Object.keys(feature.properties).forEach((key) => {
        if (pattr.has(key)) pattributes.set(key, feature.properties[key]);
        else nattributes.set(key, feature.properties[key]);
      });
      const properties = Object.fromEntries(
        pattributes.entries()
      ) as Feature["properties"];
      properties["Nth"] = Object(nattributes.entries());
      feature.properties = properties;
      return feature;
    });

    const mutantObject = Object.assign(geojson, { features: nfeatures });
    const gjson = JSON.stringify(mutantObject);

    await fs.promises.writeFile(dir, gjson);

    const doc = await Layer.findOne({ _id: id }).populate<{
      vector: IVector;
    }>("vector");

    res.json({
      success: true,
      message: "Prime attributes added successfully",
      data: doc,
    });
  }
};

export const createBaseLayerByAttr = async (
  req: Request,
  res: AuthResponse
) => {
  {
    // const { name, vectorTypeId } = req.body;

    const filepath =
      "/vector/" +
      String(Date.now()) +
      "_" +
      String(req.body.name) +
      ".geojson";
    const file = DirPath(Directory.DEFAULT, filepath);

    const geojson: any = {
      type: "FeatureCollection",
      name: req.body.name,
      features: [],
    };

    const pattr = req.body.pattr;
    pattr.push("color");
    pattr.push("sys_id");
    pattr.push("icon");

    let ids: any;
    if (req.body.layers) {
      ids = req.body.layers.map((l: { layerId: any }) => l.layerId);

      const data = await Layer.find(
        {
          _id: { $in: ids },
          tenantId: res.locals.user.tenantId._id
            ? res.locals.user.tenantId._id
            : res.locals.user.tenantId._id,
        },
        {
          layerpath: 1,
        }
      ).populate<{ missionId: IMission }>("missionId");

      for (const d of data) {
        const gjson = await readGeoJson(
          DirPath(Directory.DEFAULT, d.layerpath)
        );

        if (gjson == null) {
          return res.json({
            status: false,
            message: "file path not exist! ",
          });
        }

        const features = gjson.features;

        const layer = req.body.layers.find(
          (l: { layerId: { toString: () => string } }) =>
            d._id.toString() === l.layerId.toString()
        );
        if (layer) {
          for (const f of features) {
            let feature: any = {
              ...f,
            };
            const properties = {
              ...f.properties,
            };

            const nattributes: any = {};
            const pattributes: any = {};

            for (const [attr, val] of Object.entries(flattenObj(properties))) {
              if (pattr.includes(attr)) {
                pattributes[attr] = val;
              } else {
                nattributes[attr] = val;
              }
            }

            for (const [attr, _] of Object.entries<any>(layer.attrMapping)) {
              pattributes[attr] = properties[layer.attrMapping[attr]]
                ? properties[layer.attrMapping[attr]]
                : "null";
            }

            feature = {
              ...feature,
              properties: {
                ...pattributes,
                Nth: {
                  ...nattributes,
                },
              },
            };

            geojson.features.push(feature);
            for (let j = 0; j < geojson.features.length; j++) {
              geojson.features[j].properties.color = req.body.color
                ? req.body.color
                : "#000000";
            }
          }
        } else {
          throw Error("Something went wrong");
        }
      }
    }

    await fs.promises.writeFile(file, JSON.stringify(geojson));

    const size: number = await getFileSize(file);

    const color: any = req.body.color ? req.body.color : "#000000";

    const docCount: any = await Tenant.findById(
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

    const ress: any = await isSizeVector(size, docCount, file);

    if (ress !== true) {
      return res.status(403).json({
        status: false,
        message: "Actual storage exceeded the Limit of Set storage!",
      });
    }
    const vectorLayer = new Layer({
      name: req.body.name,
      type: "Vector",
      vector: req.body.vectorTypeId,
      tenantId: res.locals.user.tenantId._id,
      createdBy: res.locals.user._id,
      updatedBy: res.locals.user._id,
      layers: ids,
      color: color,
      fileSize: size,
      layerpath: filepath,
      captureDate: new Date(),
      featureCount: geojson.features.length,
    });

    if (vectorLayer) {
      await Layer.updateMany({ _id: { $in: ids } }, { $set: { isBase: true } });
      const savedDoc: any = await vectorLayer.save();
      await layerFiles.updateMany(
        { layerId: { $in: ids } },
        { $push: { layers: savedDoc._id } }
      );
      if (savedDoc) {
        await Tenant.findOneAndUpdate(
          {
            _id: res.locals.user.tenantId,
            actualLayerCount: {
              $gte: 0,
            },
          },
          {
            $inc: {
              actualLayerCount: 1,
            },
          }
        );
        await savedDoc.populate("vector");
      }
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
  {
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
        .populate<{ raster: IRaster }>({ path: "raster" })
        .populate<{ vector: IVector }>({ path: "vector" })
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
      })
        .sort(sort)
        .populate<{ vector: IVector }>({ path: "vector" });
      // Scope for optimization:
      // The below for loop could be completely removed and lesser docs would be read if we could use { vector: { $in: match3.type } },
      // but we can't as initially vector is just an id before populate() is done
      for (let i = 0; i < result.length; i++) {
        for (let j = 0; j < match3.type.length; j++) {
          if (result[i].vector.type == match3.type[j]) {
            d.push(result[i]);
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
      })
        .sort(sort)
        .populate<{ vector: IVector }>({ path: "vector" });
      for (let i = 0; i < result.length; i++) {
        for (let j = 0; j < match2.name.length; j++) {
          if (result[i].vector.name == match2.name[j]) {
            d.push(result[i]);
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
      })
        .sort(sort)
        .populate<{ raster: IRaster }>({ path: "raster" });
      for (let i = 0; i < result.length; i++) {
        for (let j = 0; j < match.name.length; j++) {
          if (result[i].raster.name == match.name[j]) {
            d.push(result[i]);
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

export const getMetadataForUpdatingBaseLayer = async (
  req: Request,
  res: AuthResponse
) => {
  {
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
    )
      .populate<{ missionId: IMission }>("missionId")
      .populate<{ vector: IVector }>("vector");

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
    ).populate<{ vector: IVector }>("vector");

    if (!baseLayerData) throw new Error("baseLayer data is null");

    if (data.length !== req.body.layers.length) {
      return res.json({
        success: false,
        message: "Some Layers Not Found",
      });
    } else {
      const layerTypes = new Set();
      data.forEach((element) => {
        layerTypes.add(element.vector.type);
      });

      if (layerTypes.size > 1) {
        return res.json({
          success: false,
          data: Array.from(layerTypes.values()),
          message: "Only one type of layers can be mapped",
        });
      } else if (!layerTypes.has(baseLayerData.vector.type)) {
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

      const missionMap: Map<string, missionMapVal> = new Map();
      const attrMap: Map<string, attrMapVal> = new Map();

      const bgjson = await readGeoJson(
        DirPath(Directory.DEFAULT, baseLayerData.layerpath)
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
          DirPath(Directory.DEFAULT, layer.layerpath)
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
                return {
                  ...attrMap.get(f),
                  layerMatches:
                    lm.length === 0
                      ? "No Other Mathces"
                      : lm.length === layerData.length - 1
                      ? "Matches With All"
                      : lm,
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
  }
};

export const updateBaseLayerByAttr = async (
  req: Request,
  res: AuthResponse
) => {
  {
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
    ).populate<{ vector: IVector }>("vector");

    if (!baseLayer) throw new Error("baseLayer is null or undefined");

    const bgjson = await readGeoJson(
      DirPath(Directory.DEFAULT, baseLayer.layerpath)
    );

    const color = bgjson.features[0].properties.color;
    const icon = bgjson.features[0].properties.icon;

    const newFeatures: any = [];

    let ids: any;
    if (req.body.layers) {
      ids = req.body.layers.map((l: { layerId: any }) => l.layerId);

      const data = await Layer.find(
        {
          _id: { $in: req.body.layers },
          vector: { $exists: true },
        },
        {
          layerpath: 1,
          vector: 1,
        }
      )
        .populate<{ missionId: IMission }>("missionId")
        .populate<{ vector: IVector }>("vector");

      for (const d of data) {
        if (d.vector.type !== baseLayer.vector.type) {
          return res.json({
            success: false,
            message: "Layer type must be same as base layer",
          });
        }
      }

      for (const d of data) {
        const gjson = await readGeoJson(
          DirPath(Directory.DEFAULT, d.layerpath)
        );

        if (gjson == null) {
          return res.json({
            status: false,
            message: "file path not exist! ",
          });
        }

        const features = gjson.features;

        const layer = req.body.layers.find(
          (l: { layerId: { toString: () => string } }) =>
            d._id.toString() === l.layerId.toString()
        );

        if (layer) {
          for (const f of features) {
            let feature: any = {
              ...f,
            };
            const properties = {
              ...f.properties,
            };

            const pattributes = {};

            for (const [attr, m] of Object.entries<any>(layer.attrMapping)) {
              pattributes[attr] = properties[m] ? properties[m] : "null";
            }

            feature = {
              ...feature,
              properties: {
                ...pattributes,
                color,
                icon,
                sys_id: properties.sys_id,
                Nth: {
                  ...properties,
                  sys_id: undefined,
                },
              },
            };

            newFeatures.push(feature);
          }
        } else {
          throw Error("Something went wrong");
        }
      }
    }

    const file = DirPath(Directory.DEFAULT, baseLayer.layerpath);

    bgjson.features = [...bgjson.features, ...newFeatures];

    await fs.promises.writeFile(file, JSON.stringify(bgjson));

    const size: number = await getFileSize(file);

    const docCount: any = await Tenant.findById(
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

    const ress: any = await isSizeVector(size, docCount, file);

    const prevSize = Number(docCount.actualSize);
    const newSize = prevSize - Number(baseLayer.fileSize) + size;

    if (ress !== true) {
      return res.status(403).json({
        status: false,
        message: "Actual storage exceeded the Limit of Set storage!",
      });
    }
    await Layer.updateMany({ _id: { $in: ids } }, { $set: { isBase: true } });
    const data = await Layer.updateOne(
      { _id: baseLayer._id },
      {
        featureCount: bgjson.features.length,
        $push: { layers: { $each: ids } },
        fileSize: size,
      },
      { new: true }
    ).populate<{ vector: IVector }>("vector");
    await Tenant.updateOne(
      {
        _id: res.locals.user.tenantId._id
          ? res.locals.user.tenantId._id
          : res.locals.user.tenantId,
      },
      { $inc: { actualSize: newSize } }
    );

    await res.json({
      success: true,
      message: "Layer updated successfully",
      data,
    });
  }
};

export const getBaseLayers = async (req: Request, res: AuthResponse) => {
  {
    const { type } = req.params;
    if ((type !== "Vector" && type !== "Raster" && type !== "All") || !type) {
      return res.json({
        success: false,
        message: "Please provide a valid size",
      });
    }
    // let data: (Omit<
    //   Omit<
    //     mongoose.Document<unknown, any, ILayer> &
    //       ILayer &
    //       Required<{ _id: mongoose.Types.ObjectId }>,
    //     "raster"
    //   > & { raster: IRaster },
    //   "vector"
    // > & { vector: IVector })[];
    const data = await Layer.find({
      [type !== "All" && "type"]: type,
      $and: [
        {
          $or: [{ missionId: { $exists: false } }, { missionId: null }],
        },
        {
          $or: [
            { tenantId: res.locals.user.tenantId._id },
            { createdBy: res.locals.user._id },
          ],
        },
      ],
    })
      .populate<{ raster: IRaster }>({ path: "raster" })
      .populate<{ vector: IVector }>({ path: "vector" });

    res.status(200).json({
      success: true,
      message: "BaseLayers fetched successfully",
      data: data,
    });
  }
};

// Create Base Layer
export const uploadLayerToUpdateBaseLayer = async (
  req: Request,
  res: AuthResponse
) => {
  {
    let layer: any;
    const dir = DirPath(Directory.VECTOR, req.file?.filename);

    const geojson: any = await readGeoJson(dir);

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
    if (!baseLayer) throw new Error("BaseLayer not found");

    const baseLayerPath = DirPath(Directory.DEFAULT, baseLayer.layerpath);

    const bgjson = await readGeoJson(baseLayerPath);

    if (bgjson == null) {
      return res.json({
        status: false,
        message: "file path not exist! ",
      });
    }

    if (
      geojson.features[0].geometry.type !== bgjson.features[0].geometry.type
    ) {
      await fs.promises.unlink(dir);
      return res.status(400).json({
        success: false,
        message: "The file must be of same type as base layer",
      });
    }

    const pattr: any = [];

    for (const [attr] of Object.entries<any>(bgjson.features[0].properties)) {
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

    res.json({
      success: true,
      data: {
        primeAttributes: pattr,
        layerAttributes: layerAttr,
        filePath: DirPath(Directory.VECTOR, req.file?.filename),
        baseLayer: req.body.baseLayer,
      },
    });
  }
};

// Create Base Layer
export const updateBaseLayerByUploadedFile = async (
  req: Request,
  res: AuthResponse
) => {
  {
    // TODO: Is below replacement correct? (does /../../ refer to public folder ?)
    // const dir = path.join(__dirname, "/../../", `${req.body.filePath}`);
    const dir = DirPath(Directory.DEFAULT, req.body.filePath);

    const geojson: any = await readGeoJson(dir);

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

    if (!baseLayer) throw new Error("baseLayer is null");

    const baseLayerPath = DirPath(Directory.DEFAULT, baseLayer.layerpath);

    const bgjson = await readGeoJson(baseLayerPath);

    if (bgjson == null) {
      return res.json({
        status: false,
        message: "file path not exist! ",
      });
    }

    const color = bgjson.features[0].properties.color;
    const icon = bgjson.features[0].properties.icon;

    const features = geojson.features;

    const newFeatures: any = [];

    for (const f of features) {
      let feature: any = {
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

    await fs.promises.writeFile(baseLayerPath, JSON.stringify(bgjson));

    const size: number = await getFileSize(baseLayerPath);

    const docCount: any = await Tenant.findById(
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

    const ress: any = await isSizeVector(size, docCount, baseLayerPath);

    const prevSize = Number(docCount.actualSize);
    const newSize = prevSize - Number(baseLayer.fileSize) + size;

    if (ress !== true) {
      return res.status(403).json({
        status: false,
        message: "Actual storage exceeded the Limit of Set storage!",
      });
    }

    await Layer.updateOne(
      { _id: baseLayer._id },
      { featureCount: bgjson.features.length, fileSize: size }
    );
    await Tenant.updateOne(
      {
        _id: res.locals.user.tenantId._id
          ? res.locals.user.tenantId._id
          : res.locals.user.tenantId,
      },
      { $inc: { actualSize: newSize } }
    );

    await fs.promises.unlink(dir);

    const layer = await Layer.findOne({ _id: baseLayer._id })
      .populate<{ vector: IVector }>("vector")
      .populate<{ raster: IRaster }>("raster");

    res.json({
      success: true,
      message: "Layer has been updated successfully",
      data: layer,
    });
  }
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
  {
    const name = req.body.name;
    let baseRasterLayer: any;
    const data = await Layer.find(
      {
        _id: { $in: req.body.layers },
        tenantId: res.locals.user.tenantId._id,
        raster: { $exists: true },
      },
      {
        raster: 1,
        missionId: 1,
        layerpath: 1,
        minp: 1,
        maxp: 1,
        type: 1,
      }
    )
      .populate<{ missionId: IMission }>("missionId")
      .populate<{ raster: IRaster }>("raster");
    const type = data[0].raster.name;
    if (data.length) {
      const dataArr: any = [];
      for (let i = 0; i < data.length; i++) {
        if (data[i].raster.name === type) {
          const layerdata: any = [
            {
              path: data[i].layerpath,
              minp: data[i].minp,
              maxp: data[i].maxp,
              import: true,
            },
          ];
          dataArr.push(layerdata);
        } else {
          res.status(201).json({
            status: false,
            message: "Incompatible layer types",
          });
        }
      }
      baseRasterLayer = new Layer({
        name: name,
        type: data[0].type,
        raster: data[0].raster._id,
        layerdataArr: dataArr,
        fileSize: 0,
        captureDate: req.body.captureDate,
        tenantId: res.locals.user.tenantId,
        createdBy: res.locals.user._id,
        updatedBy: res.locals.user._id,
      });
    }
    if (baseRasterLayer) {
      await Layer.updateMany(
        { _id: { $in: req.body.layers } },
        { $set: { isBase: true } }
      );
      const savedDoc = await baseRasterLayer.save();
      await Layer.updateOne(
        { _id: savedDoc._id },
        { $push: { layers: { $each: req.body.layers } } }
      );
      const tenant: any = await Tenant.findOne(
        {
          _id: res.locals.user.tenantId,
        },
        {
          actualLayerCount: 1,
        }
      );
      if (savedDoc && tenant.actualLayerCount >= 0) {
        await Tenant.update(
          { _id: res.locals.user.tenantId },
          { $inc: { actualLayerCount: 1 } }
        );
      }
      res.status(201).json({
        status: true,
        message: "New Base Layer Created Successfully",
        data: savedDoc,
      });
    } else {
      res.status(201).json({
        status: false,
        message: "Failed to create base layer",
      });
    }
  }
};

export const delete_baseLayer = async (req: Request, res: AuthResponse) => {
  {
    let layerArray: any = [];
    layerArray = req.body.layers;
    if (layerArray.length) {
      for (let i = 0; i < layerArray.length; i++) {
        const docs = await Layer.findOne(
          {
            _id: layerArray[i],
            tenantId: res.locals.user.tenantId._id,
          },
          {
            layerpath: 1,
            type: 1,
            layerdataArr: 1,
          }
        );
        if (docs) {
          if (docs.type == "Vector") {
            const fileName = path.parse(docs.layerpath).base;
            await deleteDirFileUsingName(Directory.VECTOR, fileName);

            const files = await layerFiles.find(
              {
                layerId: layerArray[i],
              },
              {
                filePath: 1,
              }
            );

            for (const f of files) {
              const fileName = path.parse(f.filePath).base;
              await deleteDirFileUsingName(Directory.GEOJSON_IMAGES, fileName);
            }

            await layerFiles.deleteMany({ layerId: layerArray[i] });

            await layerFiles.updateMany(
              { layers: { $in: [layerArray[i]] } },
              { $pull: { layers: layerArray[i] } }
            );

            const data = await Layer.deleteOne({
              _id: layerArray[i],
              tenantId: res.locals.user.tenantId._id,
            });
            if (data) {
              return res.status(200).json({
                status: true,
                message: "Base successfully deleted",
              });
            } else {
              return res.status(200).json({
                status: false,
                message: "Base could not be deleted",
              });
            }
          } else {
            for (let i = 0; i < docs.layerdataArr.length; i++) {
              if (docs.layerdataArr[i][0].import == false) {
                const fileName = path.parse(docs.layerdataArr[i][0].path).base;
                await deleteDirFileUsingName(Directory.RASTER, fileName);
              }
            }
            const data = await Layer.deleteOne({
              _id: layerArray[i],
              tenantId: res.locals.user.tenantId._id,
            });
            if (data) {
              return res.status(200).json({
                status: true,
                message: "Base successfully deleted",
              });
            } else {
              return res.status(200).json({
                status: false,
                message: "Base could not be deleted",
              });
            }
          }
        } else {
          return res.status(200).json({
            status: false,
            message: "Base could not be found",
          });
        }
      }
    } else {
      return res.status(200).json({
        status: false,
        message: "Layer array empty",
      });
    }
  }
};

export const createBaseRasterfromUpload = async (
  req: Request,
  res: AuthResponse
) => {
  {
    const tif_loc = `/raster/${req.file?.filename}`;
    let layer: HydratedDocument<ILayer>;
    const dataArr = [];

    //----------TITILER API HAS CHANGED-------------------
    //  Metadata api has been removed
    // instead there is statistics api and info api
    // let metaDataURL = `http://192.168.8.20:8000/cog/metadata?url=http://localhost:5011${tif_loc}`;
    //let metaDataURL = `http://localhost:8000/cog/metadata?url=http://localhost:5011${tif_loc}`;
    let minP = 0;
    let maxP = 1;
    const { name, type, raster, captureDate } = req.body;
    if (type == "DEM") {
      const metaDataURL = `${TITILER_SERVER}/cog/statistics?url=${TITILER_STATIC}${tif_loc}`;
      //let metaDataURL = `http://172.31.6.26:8000/cog/metadata?url=http://localhost:5011${tif_loc}`;
      const response = await fetch(metaDataURL, {
        method: "GET",
      });
      const metadata = await response.json();
      //-------handle for detail:not found----
      minP = metadata["1"]["min"];
      maxP = metadata["1"]["max"];
    }
    // let center = {
    //   lat: (metadata["bounds"][1] + metadata["bounds"][3]) / 2,
    //   lng: (metadata["bounds"][0] + metadata["bounds"][2]) / 2,
    // };
    const size: number = Number(
      (Number(req.file?.size) / (1024 * 1024)).toFixed(5)
    );
    const layerData = [
      {
        path: `/raster/${req.file.filename}`,
        minP: minP,
        maxP: maxP,
        import: false,
      },
    ];
    if (layerData) {
      dataArr.push(layerData);
    }
    layer = new Layer({
      name: `base - ${name}`,
      type,
      raster,
      layerdataArr: dataArr,
      captureDate,
      fileSize: size,
      tenantId: res.locals.user.tenantId,
      createdBy: res.locals.user._id,
      updatedBy: res.locals.user._id,
    });
    if (layer) {
      const savedDoc = await layer.save();
      const tenant = await Tenant.findOne(
        {
          _id: res.locals.user.tenantId,
        },
        {
          actualLayerCount: 1,
        }
      );
      if (savedDoc && tenant.actualLayerCount >= 0) {
        await Tenant.updateOne(
          { _id: res.locals.user.tenantId },
          { $inc: { actualLayerCount: 1 } }
        );
      }
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
  }
};

export const updateBaseLayerRasterUpload = async (
  req: Request,
  res: AuthResponse
) => {
  {
    if (req.file) {
      const doc = await Layer.findOne(
        {
          _id: req.body.layerId,
          tenantId: res.locals.user.tenantId._id,
        },
        {
          layerdataArr: 1,
          fileSize: 1,
        }
      );
      if (doc) {
        const tif_loc = `/raster/${req.file?.filename}`;
        //----------TITILER API HAS CHANGED-------------------
        //  Metadata api has been removed
        // instead there is statistics api and info api
        // let metaDataURL = `http://192.168.8.20:8000/cog/metadata?url=http://localhost:5011${tif_loc}`;
        //let metaDataURL = `http://localhost:8000/cog/metadata?url=http://localhost:5011${tif_loc}`;
        const metaDataURL = `${TITILER_SERVER}/cog/statistics?url=${TITILER_STATIC}${tif_loc}`;
        //let metaDataURL = `http://172.31.6.26:8000/cog/metadata?url=http://localhost:5011${tif_loc}`;
        const response = await fetch(metaDataURL, {
          method: "GET",
        });
        const metadata = await response.json();
        //-------handle for detail:not found----
        const minP = metadata["1"]["min"];
        const maxP = metadata["1"]["max"];
        // let center = {
        //   lat: (metadata["bounds"][1] + metadata["bounds"][3]) / 2,
        //   lng: (metadata["bounds"][0] + metadata["bounds"][2]) / 2,
        // };
        const size: number = Number(
          (Number(req.file?.size) / (1024 * 1024)).toFixed(5)
        );
        const newSize: any = Number(size + Number(doc.fileSize));
        const dataArr: any = [];
        const layerData = {
          path: `/raster/${req?.file?.filename}`,
          minP: minP,
          maxP: maxP,
          import: false,
        };
        if (layerData) {
          dataArr.push(layerData);
          let finalDataArr: any;
          finalDataArr = doc.layerdataArr;
          finalDataArr.push(dataArr);
          if (finalDataArr.length) {
            const updateLayer = await Layer.updateOne(
              { _id: req.body.layerId },
              { fileSize: newSize, layerdataArr: finalDataArr }
            );
            const layer: any = await Layer.findOne({ _id: req.body.layerId });
            if (updateLayer) {
              res.status(200).json({
                status: true,
                message: "Raster layer updated sucessfully",
                data: layer,
              });
            } else {
              res.status(200).json({
                status: false,
                message: "Oops something went wrong",
              });
            }
          } else {
            res.status(200).json({
              status: false,
              message: "Oops something went wrong",
            });
          }
        } else {
          res.status(200).json({
            status: false,
            message: "Oops something went wrong",
          });
        }
      } else {
        res.status(200).json({
          status: false,
          message: "Layer not found",
        });
      }
    } else {
      res.json({
        status: false,
        message: "Server error",
      });
    }
  }
};

export const updateBaseLayerRasterImport = async (
  req: Request,
  res: AuthResponse
) => {
  {
    const doc = await Layer.findOne(
      {
        _id: req.body.layerId,
        tenantId: res.locals.user.tenantId._id,
        raster: { $exists: true },
      },
      {
        raster: 1,
        layerdataArr: 1,
      }
    ).populate<{ raster: IRaster }>("raster");
    if (doc) {
      const data = await Layer.find(
        {
          _id: { $in: req.body.layers },
          tenantId: res.locals.user.tenantId._id,
          raster: { $exists: true },
        },
        {
          raster: 1,
          layerpath: 1,
          minp: 1,
          maxp: 1,
        }
      )
        .populate<{ missionId: IMission }>("missionId")
        .populate<{ raster: IRaster }>("raster");
      const type = doc.raster.name;
      if (data.length) {
        const dataArr: any = [];
        for (let i = 0; i < data.length; i++) {
          if (data[i].raster.name === type) {
            const layerdata: any = {
              path: data[i].layerpath,
              minp: data[i].minp,
              maxp: data[i].maxp,
              import: true,
            };
            dataArr.push(layerdata);
          } else {
            res.status(201).json({
              status: false,
              message: "Incompatible layer types",
            });
          }
        }
        if (dataArr.length) {
          let finaldataArr: any;
          finaldataArr = doc.layerdataArr;
          finaldataArr.push(dataArr);
          if (finaldataArr.length) {
            const updateLayer: any = await Layer.findByIdAndUpdate(
              { _id: req.body.layerId },
              {
                layerdataArr: finaldataArr,
                $push: { layers: { $each: req.body.layers } },
              },
              { new: true }
            );
            if (updateLayer) {
              await Layer.updateMany(
                { _id: { $in: req.body.layers } },
                { $set: { isBase: true } }
              );

              //let doc2:any = await Layer.findOne({_id:req.body.layerId,tenantId:res.locals.user.tenantId});
              res.status(200).json({
                status: true,
                message: "Raster layer updated sucessfully",
                data: updateLayer,
              });
            } else {
              res.status(200).json({
                status: false,
                message: "Oops something went wrong",
              });
            }
          } else {
            res.status(200).json({
              status: false,
              message: "Oops something went wrong",
            });
          }
        } else {
          res.status(200).json({
            status: false,
            message: "Oops something went wrong",
          });
        }
      } else {
        res.status(200).json({
          status: false,
          message: "Oops something went wrong",
        });
      }
    } else {
      res.status(200).json({
        status: false,
        message: "Layer not found",
      });
    }
  }
};

export const isBaseupdateDev = async (req: Request, res: AuthResponse) => {
  {
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
      for (let i = 0; i < docs.length; i++) {
        if (docs[i].isBase != true && docs[i].missionId != null) {
          docs[i].isBase = false;
          await Layer.updateOne(
            { _id: docs[i]._id },
            { isBase: docs[i].isBase }
          );
        }
        if (
          docs[i].isBase != true &&
          docs[i].missionId == null &&
          docs[i].type == "Vector"
        ) {
          docs[i].isBase = false;
          await Layer.updateOne(
            { _id: docs[i]._id },
            { isBase: docs[i].isBase }
          );
        }
        if (
          docs[i].isBase != true &&
          docs[i].missionId == null &&
          docs[i].type == "Raster"
        ) {
          docs[i].isBase = false;
          await Layer.updateOne(
            { _id: docs[i]._id },
            { isBase: docs[i].isBase }
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
  }
};

export const createBaseVectorLayer = async (
  req: Request,
  res: AuthResponse
) => {
  {
    //const filepath = `/vector/${req.body.name}-${new Date().toISOString()}.geojson`
    const filepath =
      "/vector/" +
      String(Date.now()) +
      "_" +
      String(req.body.name) +
      ".geojson";
    const file = DirPath(Directory.DEFAULT, filepath);
    await fs.promises.writeFile(file, JSON.stringify(req.body.geoJSON));

    const geojson: any = await readGeoJson(file);
    // let fc: any = geojson.features.length;
    if (geojson == null) {
      return res.json({
        status: false,
        message: "file path not exist! ",
      });
    }

    const modCheck: any = await modGeoJson(null, null, geojson, file);
    if (modCheck == 0) {
      return res.json({
        status: false,
        message: "Color selection error",
      });
    }

    const color: any = req.body.geoJSON.features[0].properties.color;
    const size: number = await getFileSize(file);
    const docCount: any = await Tenant.findOne({
      _id: res.locals.user.tenantId,
    })
      .populate<{ activePackage: IPackage }>("activePackage")
      .lean();

    const ress: any = await isSizeVector(size, docCount, file);
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
      missionId: null,
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
      const tenant = await Tenant.findOne(
        {
          _id: res.locals.user.tenantId,
        },
        {
          actualLayerCount: 1,
        }
      );
      await savedDoc.populate("vector");
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
        message: "Sucessfully created base vector layer",
        data: savedDoc,
      });
    } else {
      res.status(201).json({
        status: false,
        message: "Failed to create base vector layer",
      });
    }
  }
};

export const publishBaseLayer = async (req: Request, res: AuthResponse) => {
  {
    const doc = await Layer.findOne(
      {
        _id: req.body.layerId,
        tenantId: res.locals.user.tenantId,
      },
      {
        tenantId: 1,
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
      if (tenantDoc.publicMapRef == null) {
        const randomString = new ObjectId();
        const unid = `${doc.tenantId}${randomString}`;
        await Tenant.updateOne(
          { _id: res.locals.user.tenantId },
          { publicMapRef: unid }
        );
        await Layer.updateOne({ _id: req.body.layerId }, { isPublic: true });
      } else {
        await Layer.updateOne({ _id: req.body.layerId }, { isPublic: true });
      }
      const getDoc = await Layer.findOne({ _id: req.body.layerId })
        .populate<{ tenantId: ITenant }>("tenantId")
        .populate<{ vector: IVector }>("vector");
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
  }
};

export const getallpublicbaselayer = async (
  req: Request,
  res: AuthResponse
) => {
  {
    req.log.info(req.query.mapRef);
    const tenant = await Tenant.findOne(
      {
        publicMapRef: req.query.mapRef,
      },
      {
        _id: 1,
      }
    );
    const docs = await Layer.find({ tenantId: tenant._id, isPublic: true })
      .populate<{ tenantId: ITenant }>("tenantId", "name")
      .populate<{ vector: IVector }>("vector");
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
  }
};

export const isPublicupdateDev = async (req: Request, res: AuthResponse) => {
  {
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
      for (let i = 0; i < docs.length; i++) {
        if (docs[i].isPublic != true && docs[i].missionId != null) {
          docs[i].isPublic = false;
          docs[i].publicMapRef = null;
          await Layer.updateOne(
            { _id: docs[i]._id },
            { isPublic: docs[i].isPublic, publicMapRef: docs[i].publicMapRef }
          );
        }
        if (
          docs[i].isPublic != true &&
          docs[i].missionId == null &&
          docs[i].type == "Vector"
        ) {
          docs[i].isPublic = false;
          docs[i].publicMapRef = null;
          await Layer.updateOne(
            { _id: docs[i]._id },
            { isPublic: docs[i].isPublic, publicMapRef: docs[i].publicMapRef }
          );
        }
        if (
          docs[i].isPublic != true &&
          docs[i].missionId == null &&
          docs[i].type == "Raster"
        ) {
          docs[i].isPublic = false;
          docs[i].publicMapRef = null;
          await Layer.updateOne(
            { _id: docs[i]._id },
            { isPublic: docs[i].isPublic, publicMapRef: docs[i].publicMapRef }
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
  }
};

export const publicbaselayerSearch = async (
  req: Request,
  res: AuthResponse
) => {
  {
    const tenant = await Tenant.findOne({ publicMapRef: req.query.mapRef });
    const key = req.query.key as string;
    const value = req.query.value;
    const ar = new Array<Feature & { index: number }>();
    let flag = 0;
    if (tenant) {
      const docs: any = await Layer.find(
        {
          tenantId: tenant,
          isPublic: true,
        },
        {
          layerpath: 1,
        }
      );
      if (docs.length) {
        for (let i = 0; i < docs.length; i++) {
          const gjson = await readGeoJson(
            DirPath(Directory.DEFAULT, docs[i].layerpath)
          );
          for (let j = 0; j < gjson.features.length; j++) {
            if (gjson.features[j].properties[key]) {
              const str: any = String(gjson.features[j].properties[key]);
              if (str.length >= value.length) {
                if (str.includes(value)) {
                  ar.push({ ...gjson.features[j], index: j });
                  flag = 1;
                }
              }
            }
          }
          if (flag == 1) {
            return res.status(200).json({
              status: true,
              message: "Match found",
              layerId: docs[i]._id,
              data: ar,
            });
          }
        }
        if (flag != 1) {
          return res.status(200).json({
            status: false,
            message: "No Match found",
          });
        }
      } else {
        return res.status(200).json({
          status: false,
          message: "No public layers found",
        });
      }
    } else {
      res.status(200).json({
        status: false,
        message: "Invalid PublicMapRef",
      });
    }
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
  return;
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
  return;
};
