import { Request } from "express";
import { Types } from "mongoose";

import { Directory, DirPath } from "../../constants";
import Document from "../../models/document";
import Mission from "../../models/mission";
import Tenant from "../../models/tenant";
import UploadTask from "../../models/uploadTask";
import { missionSpecificSocket } from "../../socket";
import { createArchive, permPath } from "../../utils/dataUtils";
import { checkFileExists, getFileSize } from "../../utils/fileUtils";
import { saveThumbnails } from "../../utils/imageUtils";
import { AuthResponse } from "../../utils/interfaceUtils";

export const createDocument = async (req: Request, res: AuthResponse) => {
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
  const savedDoc = await doc.create();
  await fileDoc.delete();
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
};

export const deleteDocument = async (req: Request, res: AuthResponse) => {
  const data = await Document.findOne({
    _id: req.query.id,
    tenantId: res.locals.user.tenantId._id,
  });
  if (data) {
    await data.delete();
    res.status(200).json({
      status: true,
      message: "Document Deleted",
      data: data,
    });
    missionSpecificSocket
      .to(data.missionId.toString())
      .emit("DOCUMENT_DELETED", data);
  } else {
    res.json({
      status: false,
      message: "Document ID does not match",
    });
  }
};

export const deletemultipleDocument = async (
  req: Request,
  res: AuthResponse
) => {
  const documents = await Document.find(
    {
      _id: { $in: req.body.id },
      tenantId: res.locals.user.tenantId._id,
    },
    {
      filePath: 1,
      folderName: 1,
      fileSize: 1,
      fileType: 1,
      tenantId: 1,
      missionId: 1,
    }
  );
  for (const d of documents) {
    await d.delete();
  }
  res.status(200).json({
    status: true,
    message: "Documents deleted",
  });
};

export const getbymissionID = async (req: Request, res: AuthResponse) => {
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
};

export const getImagesbymissionID = async (req: Request, res: AuthResponse) => {
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
};

export const zipbymissionId = async (req: Request, res: AuthResponse) => {
  const missionId = req.query.missionId as string;
  const filename = "allDocuments-" + missionId + ".zip";
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
      const zipFile = await createArchive(
        filename,
        d.map((d) => d.filePath),
        missionId,
        res.locals.user.tenantId._id,
        res.locals.user._id
      );
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
      const archive = await createArchive(
        filename,
        d.map((layer) => layer.filePath),
        missionId,
        res.locals.user.tenantId._id,
        res.locals.user._id
      );
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
};

export const gen2x = async (req: Request, res: AuthResponse) => {
  if (req.body.folderName == "rawPhotos" || req.body.folderName == "photos") {
    const doc = await Document.findOne({
      filePath: req.body.filePath,
      tenantId: res.locals.user.tenantId,
    });
    if (doc) {
      const thumbs = await saveThumbnails(doc.filePath);
      doc.fileSize += thumbs.size;
      await doc.save();
      // update size details
      await Tenant.updateOne(
        { _id: doc.tenantId },
        { $inc: { actualSize: doc.fileSize, allDocumentsSize: doc.fileSize } }
      );
      await Mission.updateOne(
        { _id: doc.missionId },
        { $inc: { size: doc.fileSize } }
      );
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
};

export const updateSizeExistDoc = async (req: Request, res: AuthResponse) => {
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
    for (const doc of docs) {
      const newFilename = DirPath(Directory.ROOT, doc.filePath);
      if (await checkFileExists(newFilename)) {
        const size: number = await getFileSize(newFilename);
        if (size != doc.fileSize) {
          const oldSize = doc.fileSize;
          doc.fileSize = size;
          await doc.save();
          // update size details
          await Tenant.updateOne(
            { _id: doc.tenantId },
            {
              $inc: {
                actualSize: doc.fileSize - oldSize,
                allDocumentsSize: doc.fileSize - oldSize,
              },
            }
          );
          await Mission.updateOne(
            { _id: doc.missionId },
            { $inc: { size: doc.fileSize - oldSize } }
          );
        }
      } else {
        await doc.delete();
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
};

export const updateDoc = async (req: Request, res: AuthResponse) => {
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
};

export const updateMultiDoc = async (req: Request, res: AuthResponse) => {
  const Ids: string[] = req.body.Id.map((id: any) => String(id));
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
};
