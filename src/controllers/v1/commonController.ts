import { Request } from "express";
import Tenant from "../../models/tenant";
import User from "../../models/user";
import path from "path";
import { deletePublicFileUsingPath } from "../../utils/fileDeleteUtils";
import { AuthResponse } from "../../utils/interfaceUtils";
import { checkFileExists } from "../../utils/fileUtils";
import { Directory, DirPath } from "../../constants";
import { saveThumbnails } from "../../utils/imageUtils";
import * as pathUtils from "../../utils/pathUtils";

//pupload file
export const uploadFile = async (req: Request, res: AuthResponse) => {
  {
    if (req.file?.fieldname == "image") {
      if (
        req.file?.mimetype === "image/jpeg" ||
        req.file?.mimetype === "image/png"
      ) {
        await saveThumbnails(pathUtils.docPath(pathUtils.Directory.ALERT_IMAGES, req.file.filename));
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
        DirPath(Directory.DEFAULT),
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
          await saveThumbnails(pathUtils.docPath(pathUtils.Directory.TEMP_IMAGES, req.file.filename));
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
