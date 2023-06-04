import { Request, Router } from "express";
import openApi from "./openApi";
import { Types } from "ts-openapi";
import Layer from "../../models/layer";
import LayerFile from "../../models/layerFiles";
import { LayerType } from "../../schemas/layer";
import { LayerFileType } from "../../schemas/layerFiles";
import { AuthResponse } from "../../utils/interfaceUtils";
import Flight from "../../models/flight";
import { DirPath, Directory } from "../../constants";
import { checkFileExists, getFileSize } from "../../utils/fileUtils";

const layerApi = Router();

layerApi.get("/", async (req: Request<null, {}, null, {
  layerId?: string,
  missionId?: string,
  orderBy: string,
  asc: boolean,
  type?: string,
  vector?: string,
  raster?: string,
  isPublic?: boolean,
  isBase?: boolean,
  isFlagged?: boolean,
  timespan: [string, string],
  limit: number,
  offset: number,
  populate: string[],
}>, res: AuthResponse) => {
  const { layerId, missionId, orderBy, asc, type, vector, raster, isPublic, isBase, isFlagged, timespan, limit, offset, populate } = req.query;
  const data = await Layer.find(
    {
        tenantId: res.locals.user.tenantId._id,
        [layerId && "_id"]: layerId,
        [missionId && "missionId"]: missionId,
        [type && "type"]: type,
        [(type === "Vector") && vector && "vector"]: vector,
        [(type === "Raster") && raster && "raster"]: raster,
        [isPublic && "isPublic"]: isPublic,
        [isBase && "isBase"]: isBase,
        [isFlagged && "isFlagged"]: isFlagged,
        [timespan?.length && "createdAt"]: { $gte: timespan?.[0], $lte: timespan?.[1] },
    }, {}, {
        sort: {
            [orderBy]: asc ? "asc" : "desc",
        }
    })
    .skip(offset)
    .limit(limit)
    .populate(populate)
    .lean();

  let resp: any = {
    data,
    pagination: {
      limit,
      offset,
      count: data.length
    }
  };

  if(missionId) {
      const flight = await Flight.findOne<{
        centerPoints: {
          lat: number;
          lng: number;
        };
      }>(
        {
          mission: missionId,
          tenant: res.locals.user.tenantId._id,
        },
        {
          centerPoints: 1,
        }
      );
      resp.centerPoints = flight.centerPoints;
  }

  if(layerId) {
    const docpath = DirPath(Directory.DEFAULT, data[0].layerpath);
    resp.size = await getFileSize(docpath);
    if (await checkFileExists(docpath)) {
        const downloadlink = docpath
            .split(/[\\\/]/)
            .slice(8)
            .join("/");
        resp.downloadLink = downloadlink;
    }
  }

  res.json(resp);
});

openApi.addPath("/layer", {
    get: {
      summary: "Get layer data",
      description: "This operation retrives layer information",
      operationId: "GetLayer",
      requestSchema: {
        query: {
          layerId: Types.String(),
          missionId: Types.String(),
          orderBy: Types.String({ default: "createdAt", required: true }),
          asc: Types.Boolean({ default: false, required: true }),
          type: Types.String(),
          vector: Types.String(),
          raster: Types.String(),
          isPublic: Types.Boolean(),
          isBase: Types.Boolean(),
          isFlagged: Types.Boolean(),
          timespan: Types.Array({ arrayType: Types.DateTime(), minLength: 2, maxLength: 2 }),
          offset: Types.Integer({ minValue: 0, default: 0, required: true }),
          limit: Types.Integer({ minValue: 0, maxValue: 100, default: 10, required: true }),
          populate: Types.Array({ arrayType: Types.String() }),
        }
      },
      tags: ["Layer API"],
      responses: {
        200: openApi.declareSchema("successful response",
          Types.Object({
            description: "Successful Operation",
            properties: {
              data: Types.Array({ arrayType: LayerType }),
              pagination: Types.Object({
                  description: "pagination information for data",
                  properties: {
                      offset: Types.Integer({ minValue: 0 }),
                      limit: Types.Integer({ minValue: 0, maxValue: 100, default: 10 }),
                      count: Types.Integer({ minValue: 0, maxValue: 100, default: 10 })
                    }
                }),
                centerPoints: Types.Object({ 
                  description: "information about the center point of the mission's flight sent only if missionId provided",
                  properties: {
                      lat: Types.Number(),
                      lng: Types.Number(),
                  } 
                }),
                size: Types.Number({
                    description: "information about the size of the layer. Present in response only if layerId is passed (single layer fetched)."
                }),
                downloadLink: Types.Number({
                    description: "Link to download the layer's file(geojson or tiff). Present in response only if layerId is passed (single layer fetched)."
                }),
            },
          })
        )
      }
    }
  }, true)

layerApi.get("/getLayerFiles", async (req: Request<null, {}, null, {
  layerId?: string,
  sysId?: string,
  isReview?: boolean,
  limit: number,
  offset: number,
  populate: string[],
}>, res: AuthResponse) => {
  const { layerId, sysId, isReview, limit, offset, populate } = req.query;
  const data = await LayerFile.find({
    tenantId: res.locals.user.tenantId._id,
    [layerId && "layerId"]: layerId,
    [layerId && "layers"]: { $in: [layerId] },
    [sysId && "sys_Id"]: sysId,
    [isReview && "isReview"]: isReview,
  })
  .skip(offset)
  .limit(limit)
  .populate(populate)
  .lean();
  res.json({
    data,
    pagination: {
      limit,
      offset,
      count: data.length
    },
  })
});
  
openApi.addPath("/layer/getLayerFiles", {
    get: {
      summary: "Get layer file data",
      description: "This operation retrives layer file information",
      operationId: "GetLayerFile",
      requestSchema: {
        query: {
          layerId: Types.String(),
          sysId: Types.String(),
          isReview: Types.Boolean(),
          offset: Types.Integer({ minValue: 0, default: 0, required: true }),
          limit: Types.Integer({ minValue: 0, maxValue: 100, default: 10, required: true }),
          populate: Types.Array({ arrayType: Types.String() }),
        }
      },
      tags: ["Layer Files API"],
      responses: {
        200: openApi.declareSchema("successful response",
          Types.Object({
            description: "Successful Operation",
            properties: {
              data: Types.Array({ arrayType: LayerFileType }),
              pagination: Types.Object({
                description: "pagination information for data",
                properties: {
                  offset: Types.Integer({ minValue: 0 }),
                  limit: Types.Integer({ minValue: 0, maxValue: 100, default: 10 }),
                  count: Types.Integer({ minValue: 0, maxValue: 100, default: 10 })
                }
              })
            },
          })
        )
      }
    }
  }, true)

export default layerApi;