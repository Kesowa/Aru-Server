import { Request } from "express";
import Tenant from "../../models/tenant";
import User from "../../models/user";
import path from "path";
import { deletePublicFileUsingPath } from "../../utils/fileDeleteUtils";
import { AuthResponse } from "../../utils/interfaceUtils";
import { checkFileExists } from "../../utils/fileUtils";
import { Directory, DirPath, S3_BUCKET_NAME } from "../../constants";
import { saveThumbnails } from "../../utils/imageUtils";
import * as pathUtils from "../../utils/pathUtils";
import { minioClient } from "../../utils/objectStorage";
import { IPackage } from "../../schemas/package";
import { randomUUID } from "crypto";

//pupload file
export const uploadFile = async (req: Request, res: AuthResponse) => {
  {
    if (req.file?.fieldname == "image") {
      if (
        req.file?.mimetype === "image/jpeg" ||
        req.file?.mimetype === "image/png"
      ) {
        await saveThumbnails(
          pathUtils.docPath(pathUtils.Directory.ALERT_IMAGES, req.file.filename)
        );
      }
      if (req.file) {
        res.status(201).json({
          status: true,
          message: "file uploaded sucessfully",
          file: `/images/alertImages/${req.file?.filename}`,
        });
      } else {
        res.json({
          status: false,
          message: "Invalid file.",
        });
      }
    } else {
      const img_path = path.relative(
        DirPath(Directory.ROOT),
        String(req?.file?.path)
      );
      if (req.file) {
        res.status(201).json({
          status: true,
          message: "file uploaded sucessfully",
          file: `/${img_path}`,
        });
      } else {
        res.json({
          status: false,
          message: "Invalid file.",
        });
      }
    }
  }
};

//check if email is available for registration
export const checkIfEmailIdIsAvailable = async (
  req: Request,
  res: AuthResponse
) => {
  {
    const [existingTenantWithEmail, existingUserWithEmail] = await Promise.all([
      User.findOne({ email: req.body.email }),
      Tenant.findOne({ email: req.body.email }),
    ]);
    if (existingTenantWithEmail || existingUserWithEmail) {
      res.json({
        status: true,
        message: "This email id is already taken.",
        isAvailable: false,
      });
    } else {
      const [existingTenantWithEmail, existingUserWithEmail] =
        await Promise.all([
          User.findOne({ email: req.body.email }, { _id: 1 }),
          Tenant.findOne({ email: req.body.email }, { _id: 1 }),
        ]);
      if (existingTenantWithEmail || existingUserWithEmail) {
        res.json({
          status: true,
          message: "This email id is already taken.",
          isAvailable: false,
        });
      } else {
        res.json({
          status: true,
          message: "This email id is available.",
          isAvailable: true,
        });
      }
    }
  }
};

export const uploadFileforUSer = async (req: Request, res: AuthResponse) => {
  {
    const img_path = DirPath(Directory.TEMP_IMAGES, req.file?.filename);
    if (
      req.file?.mimetype === "image/jpeg" ||
      req.file?.mimetype === "image/png"
    ) {
      if (await checkFileExists(img_path)) {
        try {
          await saveThumbnails(
            pathUtils.docPath(
              pathUtils.Directory.TEMP_IMAGES,
              req.file.filename
            )
          );
        } catch (err) {
          req.log.error(err);
        }
      }
    }
    if (
      await checkFileExists(
        DirPath(Directory.TEMP_IMAGES, `2x_${req.file?.filename}`)
      )
    ) {
      await deletePublicFileUsingPath(`/images/temp/${req.file?.filename}`);
    }
    if (req.file) {
      res.status(201).json({
        status: true,
        message: "file uploaded sucessfully",
        file: `/images/temp/2x_${req.file?.filename}`,
      });
    } else {
      res.json({
        status: false,
        message: "Invalid file.",
      });
    }
  }
};


export const createUploadUrl = async (req: Request<{}, {}, {
  name: string;
  size: number;
  type: string;
}>, res: AuthResponse) => {
  // check storage
  const sizeInMb = req.body.size / (1024 * 1024);
  const tenantPackage = await Tenant.findOne({ _id: res.locals.user.tenantId })
    .populate<{ activePackage: IPackage }>("activePackage")
  if (tenantPackage.activePackage.storage - tenantPackage.storageUsed < sizeInMb) {
    res.status(401).json({
      status: false,
      message: "insufficient storage available"
    });
  }

  // const presignedUrl = await minioClient.presignedPutObject(S3_BUCKET_NAME, req.body.type.split('/').at(0) + randomUUID(), 3600 * 24);
  const policy = minioClient.newPostPolicy();
  policy.setBucket(S3_BUCKET_NAME);
  policy.setContentLengthRange(req.body.size * 0.9, req.body.size * 1.1);
  policy.setContentType(req.body.type);
  const expiry = new Date();
  expiry.setSeconds(3600 * 24);
  policy.setExpires(expiry);
  policy.setKey(randomUUID());
  policy.setUserMetaData({
    name: req.body.name,
    user: res.locals.user._id.toJSON(),
  });

  const presignedUrl = await minioClient.presignedPostPolicy(policy);

  res.status(201).json({
    status: true,
    message: "created presigned url",
    data: presignedUrl,
  })

}
