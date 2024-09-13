import { Request } from "express";
import Tenant from "../../models/tenant";
import User from "../../models/user";
import path from "path";
import { AuthResponse } from "../../utils/interfaceUtils";
import {
  CDN_URL,
  S3_BUCKET_NAME,
} from "../../constants";
import { Directory } from "../../utils/pathUtils";
import { minioClient } from "../../utils/objectStorage";
import { IPackage } from "../../schemas/package";
import { randomUUID } from "crypto";
import uploadModel from "../../models/uploadTask";

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

export const createUploadUrl = async (
  req: Request<
    {},
    {},
    {
      name: string;
      size: number;
      type: string;
      model: string;
    }
  >,
  res: AuthResponse
) => {
  // check storage
  const sizeInMb = req.body.size / (1024 * 1024);
  const tenantPackage = await Tenant.findOne({
    _id: res.locals.user.tenantId,
  }).populate<{ activePackage: IPackage }>("activePackage");
  if (
    tenantPackage.activePackage.storage - tenantPackage.storageUsed <
    sizeInMb
  ) {
    res.status(401).json({
      status: false,
      message: "insufficient storage available",
    });
  }

  const policy = minioClient.newPostPolicy();
  policy.setBucket(S3_BUCKET_NAME);
  policy.setContentLengthRange(req.body.size * 0.99, req.body.size * 1.01);
  policy.setContentType(req.body.type);
  const expiry = new Date();
  expiry.setSeconds(3600 * 24);
  policy.setExpires(expiry);
  const safeName = encodeURIComponent(req.body.name);
  policy.setContentDisposition(
    `attachment; filename="${safeName}"; filename*="${safeName}"`
  );
  const ext = path.extname(req.body.name);
  const key = path.join(Directory.TEMP, randomUUID() + ext);
  policy.setKey(key);
  policy.setUserMetaData({
    name: req.body.name,
    user: res.locals.user._id.toJSON(),
    tenant: res.locals.user.tenantId._id.toJSON(),
  });

  const presignedUrl = await minioClient.presignedPostPolicy(policy);

  const uploadTask = await uploadModel.create({
    tenant: res.locals.user.tenantId._id,
    createdBy: res.locals.user._id,
    updatedBy: res.locals.user._id,
    docModel: req.body.model,
    status: "started",
    metadata: {
      objectkey: key,
      filesize: sizeInMb,
      mimetype: req.body.type,
      originalName: req.body.name,
    },
    presigned: {
      formData: presignedUrl.formData,
      postURL: CDN_URL, // !REVISIT: Change to public s3 path
    },
  });

  res.status(201).json({
    status: true,
    message: "created presigned url",
    data: uploadTask,
  });
};
