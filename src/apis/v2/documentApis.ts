/* eslint-disable @typescript-eslint/no-misused-promises */
import { Request, Router } from "express";
import openApi from "./openApi";
import { Types } from "ts-openapi";
import Document from "../../models/document";
import { DocumentType } from "../../schemas/document";
import { AuthResponse } from "../../utils/interfaceUtils";
import archiver from "archiver";
import { Directory, DirPath } from "../../constants";
import { missionSpecificSocket } from "../../socket";
import { createDirIfNotExists } from "../../utils/fileUtils";
import fs from "fs";

const documentApi = Router();

documentApi.get(
  "/",
  async (
    req: Request & {
      query: {
        missionId?: string;
        isFlagged?: boolean;
        folderName?: string;
        zip?: boolean;
        orderBy: string;
        asc: boolean;
        limit: number;
        offset: number;
        populate: string[];
      };
    },
    res: AuthResponse,
  ) => {
    const {
      missionId,
      isFlagged,
      folderName,
      zip,
      orderBy,
      asc,
      limit,
      offset,
      populate,
    } = req.query;
    const data = await Document.find(
      {
        tenantId: res.locals.user.tenantId._id,
        [missionId && "missionId"]: missionId,
        [isFlagged && "isFlagged"]: isFlagged,
        [folderName && "folderName"]: folderName,
      },
      {},
      {
        sort: {
          [orderBy]: asc ? "asc" : "desc",
        },
      },
    )
      .skip(offset)
      .limit(limit)
      .populate(populate)
      .lean();

    if (zip) {
      missionSpecificSocket.to(missionId).emit("DOCUMENT_ZIP_START");
      const dir = DirPath(Directory.ZIP);
      await createDirIfNotExists(dir, req.log);
      const fname = `${data[0].folderName}_${Date.now()}.zip`;
      const output = fs.createWriteStream(`${dir}${fname}`);
      const archive = archiver("zip", {
        zlib: { level: 9 },
      });
      archive.pipe(output);
      for (let i = 0; i < data.length; i++) {
        archive.file(DirPath(Directory.DEFAULT, data[i].filePath), {
          name: data[i].filePath.split("/")[2],
        });
      }
      try {
        const _archiveFinalized = await archive.finalize();
        const link = `/zip/${fname}`;
        missionSpecificSocket
          .to(missionId)
          .emit("DOCUMENT_ZIP_COMPLETED", link);
      } catch (error) {
        req.log.error(error);
        missionSpecificSocket.to(missionId).emit("DOCUMENT_ZIP_FAILED");
      }
    }

    res.json({
      data,
      pagination: {
        limit,
        offset,
        count: data.length,
      },
    });
  },
);

openApi.addPath(
  "/document",
  {
    get: {
      summary: "Get document data",
      description: "This operation retrieves document information",
      operationId: "GetDocument",
      requestSchema: {
        query: {
          missionId: Types.String(),
          isFlagged: Types.Boolean(),
          folderName: Types.String(),
          zip: Types.Boolean(),
          orderBy: Types.String({ default: "createdAt", required: true }),
          asc: Types.Boolean({ default: false, required: true }),
          offset: Types.Integer({ minValue: 0, default: 0, required: true }),
          limit: Types.Integer({
            minValue: 0,
            maxValue: 100,
            default: 10,
            required: true,
          }),
          populate: Types.Array({ arrayType: Types.String() }),
        },
      },
      tags: ["Document API"],
      responses: {
        200: openApi.declareSchema(
          "successful response",
          Types.Object({
            description: "Successful Operation",
            properties: {
              data: Types.Array({ arrayType: DocumentType }),
              pagination: Types.Object({
                description: "pagination information for data",
                properties: {
                  offset: Types.Integer({ minValue: 0 }),
                  limit: Types.Integer({
                    minValue: 0,
                    maxValue: 100,
                    default: 10,
                  }),
                  count: Types.Integer({
                    minValue: 0,
                    maxValue: 100,
                    default: 10,
                  }),
                },
              }),
            },
          }),
        ),
      },
    },
  },
  true,
);

export default documentApi;
