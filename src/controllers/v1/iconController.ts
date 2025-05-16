import { Request } from "express";
import { AuthResponse } from "../../utils/interfaceUtils";
import UploadTask from "../../models/uploadTask";
import { permPath } from "../../utils/dataUtils";
import { Directory } from "../../constants";
import Icon from "../../models/icon";
import { readToBuffer } from "../../utils/objectStorage";
import sharp from "sharp";

export const createIcon = async (
  req: Request,
  res: AuthResponse,
) => {
  const fileDoc = await UploadTask.findOne({
    _id: req.body.image,
    tenant: res.locals.user.tenantId._id,
    createdBy: res.locals.user._id,
  });

  const imgData = await readToBuffer(fileDoc.metadata.objectkey);
  const metadata = await sharp(imgData).metadata();

  if (metadata.format !== "jpeg" && metadata.format !== "png") {
    res.status(400).json({
      status: false,
      message: "invalid icon format, must be jpeg or png",
    });
    return;
  }

  const fullPath = await permPath(
    Directory.ICON,
    fileDoc.metadata.objectkey,
  );

  const newIcon = new Icon({
    name: req.body.name,
    description: req.body.description,
    tags: req.body.tags,
    image: fullPath,
    fileSize: fileDoc.metadata.filesize,
    tenantId: res.locals.user.tenantId._id,
    width: metadata.width,
    height: metadata.height,
    anchorX: metadata.width / 2,
    anchorY: metadata.height / 2,
    createdBy: res.locals.user._id,
  });

  const icon = await newIcon.create();

  res.status(201).json({
    status: true,
    message: "icon created",
    data: icon,
  })
}

const escapeRegex = (str: string): string =>
  str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // escape special regex characters

export const listIcon = async (
  req: Request,
  res: AuthResponse,
) => {
  const icons = await Icon.find({
    tenantId: res.locals.user.tenantId._id,
    [req.query.name && "name"]: req.query.name,
    [req.query.tags && "tags"]: { $in: req.query.tags },
  });

  res.json({
    status: true,
    data: icons,
  });
}

export const deleteIcon = async (
  req: Request,
  res: AuthResponse,
) => {
  const icon = await Icon.deleteOne({
    tenantId: res.locals.user.tenantId._id,
    _id: req.params.iconID,
  });

  if (icon.deletedCount == 1) {
    res.status(200).json({
      status: true
    })
  } else {
    res.status(404).json({
      status: false
    })
  }
}
