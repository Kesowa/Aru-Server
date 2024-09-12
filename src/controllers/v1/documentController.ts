import { Request } from "express";
import { AuthResponse } from "../../utils/interfaceUtils";
import { Types } from "mongoose";
import Document from "../../models/document";

import Mission from "../../models/mission";
import path from "path";
import { missionSpecificSocket } from "../../socket";
import {
  deletePublicFileUsingPath,
  deletePublicFolderUsingPath,
} from "../../utils/fileDeleteUtils";
import { Directory, DirPath } from "../../constants";
import { checkFileExists, getFileSize } from "../../utils/fileUtils";
import { deleteThumbnails, saveThumbnails } from "../../utils/imageUtils";
import { createArchive, permPath, savePointcloud } from "../../utils/dataUtils";
import UploadTask from "../../models/uploadTask";

export const createDocument = async (req: Request, res: AuthResponse) => {
  {
    const fileDoc = await UploadTask.findOne({
      _id: req.body.file,
      tenant: res.locals.user.tenantId._id,
      createdBy: res.locals.user._id,
      // status: "started"
    });
    if (!fileDoc) {
      res.status(404).json({
        status: false,
        message: "no file in request",
      });
      return;
    }
    if (req.body.type === "pointCloud") {
      const { missionId } = req.body;
      missionSpecificSocket.to(missionId).emit("POINTCLOUD_EXTRACTION_START");
      req.log.info("POINTCLOUD_EXTRACTION_STARTED");
      const webviewPath = await savePointcloud(fileDoc.metadata.objectkey);
      if (webviewPath) {
        const doc = new Document({
          name: fileDoc.metadata.originalName,
          modDate: new Date(),
          fileSize: fileDoc.metadata.filesize,
          folderName: req.body.folderName,
          fileType: req.body.type,
          filePath: webviewPath,
          missionId,
          tenantId: res.locals.user.tenantId,
          createdBy: res.locals.user._id,
          updatedBy: res.locals.user._id,
        });
        const savedDoc = await doc.save();
        missionSpecificSocket
          .to(missionId)
          .emit("POINTCLOUD_EXTRACTION_COMPLETED", savedDoc);
        res.status(201).json({
          status: true,
          message: "New Document(s) Uploaded",
          data: savedDoc,
        });
        return;
      } else {
        missionSpecificSocket
          .to(missionId)
          .emit("POINTCLOUD_EXTRACTION_FAILED");
        res.status(500).json({
          status: false,
          message: "Failed to upload documents",
        });
        return;
      }
    } else {
      const missionId = req.body.missionId;
      const fullPath = await permPath(
        Directory.DOCUMENTS,
        fileDoc.metadata.objectkey
      );

      const doc = new Document({
        name: fileDoc.metadata.originalName,
        modDate: new Date(),
        fileSize: fileDoc.metadata.filesize,
        fileType: fileDoc.metadata.mimetype,
        folderName: req.body.folderName,
        filePath: fullPath,
        missionId,
        tenantId: res.locals.user.tenantId,
        createdBy: res.locals.user._id,
        updatedBy: res.locals.user._id,
      });
      if (
        (req.body.folderName == "rawPhotos" ||
          req.body.folderName == "photos") &&
        (fileDoc.metadata.mimetype == "image/jpeg" ||
          fileDoc.metadata.mimetype == "image/png")
      ) {
        req.log.debug("Uploading Thumbnails");
        const thumbs = await saveThumbnails(doc.filePath);
        doc.fileSize = thumbs.size;
      }
      const savedDoc = await doc.save();
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
      if (data.folderName == "rawPhotos" || data.folderName == "photos") {
        await deleteThumbnails(data.filePath);
      }

      await deletePublicFileUsingPath(data.filePath);
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
      if (d.folderName == "rawPhotos" || d.folderName == "photos") {
        await deleteThumbnails(d.filePath);
      }

      await deletePublicFileUsingPath(d.filePath);
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
        const zipFile = await createArchive(d.map((d) => d.filePath));
        missionSpecificSocket
          .to(missionId)
          .emit("DOCUMENT_ZIP_COMPLETED", zipFile);
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
        const archive = await createArchive(d.map((layer) => layer.filePath));
        try {
          missionSpecificSocket
            .to(missionId)
            .emit("DOCUMENT_ZIP_COMPLETED", archive);
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
        await saveThumbnails(doc.filePath);
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
        const newFilename = DirPath(Directory.ROOT, docs[i].filePath);
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
