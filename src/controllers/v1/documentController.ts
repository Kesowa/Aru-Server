import { Request } from "express";
import { AuthResponse } from "../../utils/interfaceUtils";
import { Types } from "mongoose";
import Document from "../../models/document";

import Mission from "../../models/mission";
import fs from "fs";
import archiver from "archiver";
import path from "path";
import sharp from "sharp";
import rimraf from "rimraf";
import { missionSpecificSocket } from "../../socket";
import Tenant from "../../models/tenant";
import { exec } from "child_process";
import resizer from "node-image-resizer";
import {
  deleteDirFileUsingName,
  deletePublicFileUsingPath,
  deletePublicFolderUsingPath,
} from "../../utils/fileDeleteUtils";
import { Directory, DirPath } from "../../constants";
import {
  checkFileExists,
  createDirIfNotExists,
  getFileSize,
} from "../../utils/fileUtils";
import { Thread } from "../../models/thread";

export const createDocument = async (req: Request, res: AuthResponse) => {
  {
    if (!req.file) {
      throw new Error("no file in request");
    }
    if (req.body.type == "pointCloud") {
      const { missionId } = req.body;
      const folderNamee = Date.now();
      const fileNamee = req.file?.originalname.split(/\.(?=[^\.]+$)/)[0];
      const doc_loc = DirPath(Directory.DOCUMENTS, req.file?.filename);
      req.log.info("Prining point cloud file location" + doc_loc);
      const extract_loc = DirPath(Directory.DOCUMENTS, String(folderNamee));
      await createDirIfNotExists(extract_loc, req.log);
      req.log.info("Extract location ++++++++++++++++++" + extract_loc);
      req.log.info("Starting conversion");
      //In the below line the first command is the path to the potree execuatble file after compiliation
      // For windows: `C:\\Users\\Administrator\\Downloads\\PotreeConverter_2.1_x64_windows\\PotreeConverter_2.1_x64_windows\\PotreeConverter.exe ${doc_loc} -o ${extract_loc} --generate-page ${fileNamee}`
      const ps = exec(
        `/opt/potree/PotreeConverter ${doc_loc} -o ${extract_loc} --generate-page ${fileNamee}`
      );
      //const ps = exec(`C:\\Users\\Administrator\\Downloads\\PotreeConverter_2.1_x64_windows\\PotreeConverter_2.1_x64_windows\\PotreeConverter.exe "${doc_loc}" -o "${extract_loc}" --generate-page "${fileNamee}"`);
      missionSpecificSocket.to(missionId).emit("POINTCLOUD_EXTRACTION_START");
      const onExit = async (exitCode: Number) => {
        const flag: any = 1;
        const size: number = Number(
          (Number(req.file.size) / (1024 * 1024)).toFixed(5)
        );
        if (flag == 1) {
          const doc: any = new Document({
            name: req?.file?.originalname,
            modDate: new Date(),
            fileSize: size,
            folderName: req.body.folderName,
            fileType: req.body.type,
            filePath: `/documents/${folderNamee}/${fileNamee}.html`,
            missionId,
            tenantId: res.locals.user.tenantId,
            createdBy: res.locals.user._id,
            updatedBy: res.locals.user._id,
          });
          const savedDoc = await doc.save();
          const tenant: any = Tenant.findOne({ _id: res.locals.user.tenantId });
          missionSpecificSocket
            .to(missionId)
            .emit("POINTCLOUD_EXTRACTION_COMPLETED", savedDoc);
        } else {
          rimraf(extract_loc, function (err) {
            if (err) {
              throw err;
            } else {
              req.log.info("Removed pointCloud data after extraction");
            }
          });
          missionSpecificSocket
            .to(missionId)
            .emit("POINTCLOUD_EXTRACTION_FAILED");
        }
        await fs.promises.unlink(doc_loc);
        req.log.info("Removed zip after extraction");
      };

      ps.once("exit", onExit);

      // TODO: Attach proper loggers
      // NOTE: Async task, will have to handle logging separately
      ps?.stdout?.on("data", console.log);
      ps?.stdout?.on("close", console.log);
      ps?.stdout?.on("error", console.error);
      ps?.on("message", console.log);
      ps?.stderr?.on("data", console.error);
      ps?.stderr?.on("end", console.error);

      res.json({
        status: true,
        message: "Point Cloud creation Started",
      });
    } else {
      const missionId = req.body.missionId;
      const filesize: number = Number(
        (Number(req.file.size) / (1024 * 1024)).toFixed(5)
      );
      if (
        (req.body.folderName == "rawPhotos" ||
          req.body.folderName == "photos") &&
        (req.file.mimetype == "image/jpeg" || req.file.mimetype == "image/png")
      ) {
        const x1FilePath = DirPath(
          Directory.DOCUMENTS,
          `1x_${req.file.filename}`
        );
        const x2FilePath = DirPath(
          Directory.DOCUMENTS,
          `2x_${req.file.filename}`
        );
        await sharp(req.file.path)
          .resize(1280, 720, { fit: "inside" })
          .toFile(x2FilePath);

        await sharp(x2FilePath)
          .resize(120, 120, { fit: "inside" })
          .toFile(x1FilePath);
      }
      const doc = new Document({
        name: req.file.originalname,
        modDate: new Date(),
        fileSize: filesize,
        fileType: req.file.mimetype,
        folderName: req.body.folderName,
        filePath: `/documents/${req.file.filename}`,
        missionId,
        tenantId: res.locals.user.tenantId,
        createdBy: res.locals.user._id,
        updatedBy: res.locals.user._id,
      });
      const savedDoc = await doc.save();
      const tenant = await Tenant.findOne({ _id: res.locals.user.tenantId });
      missionSpecificSocket
        .to(savedDoc.missionId.toString())
        .emit("DOCUMENT_CREATED", savedDoc);
      if (savedDoc) {
        res.status(201).json({
          status: true,
          message: "New Document(s) Uploaded",
          data: savedDoc,
        });
      } else {
        res.status(500).json({
          status: false,
          message: "Failed to upload documents",
        });
      }
    }
  }
};

export const deleteDocument = async (req: Request, res: AuthResponse) => {
  {
    const data = await Document.findOneAndDelete({
      _id: req.query.id,
      tenantId: res.locals.user.tenantId._id,
    });
    if (data.fileType == "pointCloud") {
      const folderName = path.parse(data.filePath).dir;
      await deletePublicFolderUsingPath(folderName);
      const d = await data.delete();
      if (d) {
        res.status(200).json({
          status: true,
          message: "Document Deleted",
          data: data,
        });
        missionSpecificSocket
          .to(data.missionId.toString())
          .emit("DOCUMENT_DELETED", data);
      } else {
        res.status(200).json({
          status: false,
          message: "Failed to delete documents",
        });
      }
    } else if (data) {
      const pathObj = path.parse(data.filePath);
      const fname = pathObj.base;
      if (data.folderName == "rawPhotos" || data.folderName == "photos") {
        const newFilename1 = `1x_${fname}`;
        const newFilename2 = `2x_${fname}`;
        await deleteDirFileUsingName(Directory.DOCUMENTS, newFilename1);
        await deleteDirFileUsingName(Directory.DOCUMENTS, newFilename2);
      }

      const conf = await deletePublicFileUsingPath(data.filePath);
      if (conf) {
        req.log.info("Files deleted");
      } else {
        req.log.info("Files does not exist");
      }
      if (data) {
        res.status(200).json({
          status: true,
          message: "Document Deleted",
          data: data,
        });
        missionSpecificSocket
          .to(data.missionId.toString())
          .emit("DOCUMENT_DELETED", data);
      } else {
        res.status(200).json({
          status: false,
          message: "Failed to delete documents",
        });
      }
    } else {
      res.json({
        status: false,
        message: "Document ID does not match",
      });
    }
  }
};

export const deletemultipleDocument = async (
  req: Request,
  res: AuthResponse
) => {
  {
    let flag = 0;
    const documents = await Document.find(
      {
        _id: { $in: req.body.id },
        tenantId: res.locals.user.tenantId._id,
      },
      {
        filePath: 1,
        folderName: 1,
        fileSize: 1,
      }
    );
    for (let i = 0; i < documents.length; i++) {
      const d = documents[i];
      const fname = path.parse(d.filePath).base;
      if (d.folderName == "rawPhotos" || d.folderName == "photos") {
        const newFilename1 = `1x_${fname}`;
        const newFilename2 = `2x_${fname}`;
        await deleteDirFileUsingName(Directory.DOCUMENTS, newFilename1);
        await deleteDirFileUsingName(Directory.DOCUMENTS, newFilename2);
      }

      const conf = await deletePublicFileUsingPath(d.filePath);
      if (conf) {
        req.log.info("Files Deleted");
      }
      const doc = await d.delete();
      if (doc) {
        flag = 1;
      }
    }
    if (flag == 1) {
      res.status(200).json({
        status: true,
        message: "Documents deleted",
      });
    } else {
      res.status(500).json({
        status: false,
        message: "Failed to delete documents",
      });
    }
  }
};

export const getbymissionID = async (req: Request, res: AuthResponse) => {
  {
    const id = new Types.ObjectId(String(req.query.missionId));
    const mission = await Mission.findOne({
      _id: id,
      tenantId: res.locals.user.tenantId._id,
    }).select("name");

    const total = await Document.countDocuments({
      missionId: id,
      tenantId: res.locals.user.tenantId._id,
    });

    let doc;
    if (req.query.page && req.query.limit) {
      const page = Number(req.query.page);
      const limit = Number(req.query.limit);
      const startIndex = (page - 1) * limit;
      doc = await Document.find({
        missionId: id,
        tenantId: res.locals.user.tenantId._id,
      })
        .limit(limit)
        .skip(startIndex);
    } else {
      doc = await Document.find({
        missionId: id,
        tenantId: res.locals.user.tenantId._id,
      });
    }
    if (doc) {
      res.status(200).json({
        status: true,
        message: "Documents fetched successfully",
        data: {
          mission: mission["name"],
          documents: doc,
        },
        total: total,
      });
    } else {
      res.status(200).json({
        status: false,
        message: `Document does not exist for ${id}`,
      });
    }
  }
};

export const getImagesbymissionID = async (req: Request, res: AuthResponse) => {
  {
    const page = Number(req.query.page);
    const limit = Number(req.query.limit);
    const startIndex = (page - 1) * limit;

    const sort: any = {};
    if (req.query.sortBy) {
      const parts = String(req.query.sortBy).split(":");
      sort[parts[0]] = parts[1] === "desc" ? -1 : 1;
    }

    const id = new Types.ObjectId(String(req.query.missionId));
    const mission = await Mission.findOne({
      _id: id,
      tenantId: res.locals.user.tenantId._id,
    }).select("name");

    const query = {
      missionId: id,
      tenantId: res.locals.user.tenantId._id,
      folderName: "photos",
    };

    if (req.query.isFlagged !== undefined) {
      query["isFlagged"] = req.query.isFlagged;
    }

    const total = await Document.countDocuments(query);

    const doc = await Document.find(query, null, { sort: sort })
      .limit(limit)
      .skip(startIndex);

    if (doc) {
      res.status(200).json({
        status: true,
        message: "Images fetched successfully",
        data: {
          mission: mission["name"],
          documents: doc,
          total: total,
        },
      });
    } else {
      res.status(200).json({
        status: false,
        message: `No images exist for ${id}`,
      });
    }
  }
};

export const zipbymissionId = async (req: Request, res: AuthResponse) => {
  {
    const missionId = req.query.missionId as string;
    if (req.query.folderName == "rawData") {
      const d = await Document.find({
        missionId: req.query.missionId,
        folderName: { $in: ["rawPhotos", "rawVideos"] },
        tenantId: res.locals.user.tenantId._id,
      });
      if (d.length) {
        res.status(200).json({
          status: true,
          message: "Zipping Started",
        });
        missionSpecificSocket.to(missionId).emit("DOCUMENT_ZIP_START");
        const dir = DirPath(Directory.ZIP);
        await createDirIfNotExists(dir, req.log);
        const fname = `${d[0].folderName}_${Date.now()}.zip`;
        const output = fs.createWriteStream(`${dir}${fname}`);
        const archive = archiver("zip", {
          zlib: { level: 9 }, // Sets the compression level.
        });
        // output.on('close', function () {
        //     req.log.info(archive.pointer() + ' total bytes');
        //     req.log.info('archiver has been finalized and the output file descriptor has closed.');
        // });
        archive.pipe(output);
        for (let i = 0; i < d.length; i++) {
          archive.file(DirPath(Directory.DEFAULT, d[i].filePath), {
            name: d[i].filePath.split("/")[2],
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
      } else {
        res.status(200).json({
          status: false,
          message: "MissionId or Folder name does not match",
        });
      }
    } else {
      const d = await Document.find({
        missionId: req.query.missionId,
        folderName: req.query.folderName,
        tenantId: res.locals.user.tenantId._id,
      });
      if (d.length) {
        res.status(200).json({
          status: true,
          message: "Zipping Started",
        });
        missionSpecificSocket.to(missionId).emit("DOCUMENT_ZIP_START");
        const dir = DirPath(Directory.ZIP);
        await createDirIfNotExists(dir, req.log);

        const fname = `${d[0].folderName}_${Date.now()}.zip`;
        const output = fs.createWriteStream(`${dir}${fname}`);
        const archive = archiver("zip", {
          zlib: { level: 9 }, // Sets the compression level.
        });
        // output.on('close', function () {
        //     req.log.info(archive.pointer() + ' total bytes');
        //     req.log.info('archiver has been finalized and the output file descriptor has closed.');
        // });
        archive.pipe(output);
        for (let i = 0; i < d.length; i++) {
          archive.file(DirPath(Directory.DEFAULT, d[i].filePath), {
            name: d[i].filePath.split("/")[2],
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
      } else {
        res.status(200).json({
          status: false,
          message: "MissionId or Folder name does not match",
        });
      }
    }
  }
};

export const gen2x = async (req: Request, res: AuthResponse) => {
  {
    if (req.body.folderName == "rawPhotos" || req.body.folderName == "photos") {
      const doc = await Document.findOne({
        filePath: req.body.filePath,
        tenantId: res.locals.user.tenantId,
      });
      if (doc) {
        const newFilename = DirPath(Directory.DEFAULT, doc.filePath);
        if (await checkFileExists(newFilename)) {
          await resizer(newFilename, {
            versions: [
              {
                quality: 90,
                prefix: "2x_",
                width: 1280,
                height: 720,
              },
              {
                quality: 80,
                prefix: "1x_",
                width: 120,
                height: 120,
              },
            ],
          });
        }
        res.status(200).json({
          status: true,
          message: `Successfully generated 2x files`,
        });
      } else {
        res.status(200).json({
          status: false,
          message: `Document does not exist!`,
        });
      }
    } else {
      res.status(403).json({
        status: false,
        message: `Folder name does not match!`,
      });
    }
  }
};

export const updateSizeExistDoc = async (req: Request, res: AuthResponse) => {
  {
    const docs = await Document.find(
      {
        tenantId: res.locals.user.tenantId,
      },
      {
        filePath: 1,
        fileSize: 1,
      }
    );
    if (docs.length) {
      for (let i = 0; i < docs.length; i++) {
        const newFilename = DirPath(Directory.DEFAULT, docs[i].filePath);
        if (await checkFileExists(newFilename)) {
          const size: number = await getFileSize(newFilename);
          if (size != docs[i].fileSize) {
            await Document.updateOne(
              {
                _id: docs[i]._id,
              },
              { fileSize: size },
              { upsert: true, useFindAndModify: false }
            );
          }
        } else {
          await docs[i].delete();
        }
      }
      return res.status(200).json({
        status: true,
        message: `Successfully updated fileSize`,
      });
    } else {
      res.status(200).json({
        status: false,
        message: `Document does not exist!`,
      });
    }
  }
};

export const updateDoc = async (req: Request, res: AuthResponse) => {
  {
    const Id = new Types.ObjectId(String(req.body.Id));
    const updatedDoc = await Document.findOneAndUpdate(
      { _id: Id, tenantId: res.locals.user.tenantId._id },
      req.body.update,
      {
        new: true,
      }
    );

    if (updatedDoc) {
      res.json({
        status: true,
        message: "Document updated sucessfully.",
        data: updatedDoc,
      });
    } else {
      res.status(404).json({
        status: false,
        message: "Document could not be updated.",
      });
    }
  }
};

export const updateMultiDoc = async (req: Request, res: AuthResponse) => {
  {
    const Ids: String[] = req.body.Id.map((id: any) => String(id));
    const updatedDoc = await Document.updateMany(
      { _id: { $in: Ids }, tenantId: res.locals.user.tenantId._id },
      { $set: req.body.update },
      { multi: true }
    );
    const doc = await Document.find({
      _id: { $in: Ids },
      tenantId: res.locals.user.tenantId._id,
    });
    if (updatedDoc) {
      res.json({
        status: true,
        message: "Document updated sucessfully.",
        data: doc,
      });
    } else {
      res.status(404).json({
        status: false,
        message: "Document could not be updated.",
      });
    }
  }
};
