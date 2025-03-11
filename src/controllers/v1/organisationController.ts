import { randomBytes } from "crypto";

import { Request } from "express";

import { Directory } from "../../constants";
import Tenant from "../../models/tenant";
import UploadTask from "../../models/uploadTask";
import { permPath } from "../../utils/dataUtils";
import { sendMail } from "../../utils/emailUtil";
import { saveThumbnails } from "../../utils/imageUtils";
import { AuthResponse } from "../../utils/interfaceUtils";

//check if email is available for registration
export const getOrganisationInfo = async (req: Request, res: AuthResponse) => {
  if (res.locals.user.tenantId._id) {
    const tenantData = await Tenant.findById(res.locals.user.tenantId._id);
    res.json({
      status: true,
      message: "Tenant details fetched",
      data: tenantData,
    });
  } else {
    res.json({
      status: false,
      message: "You can not use this API.",
    });
  }
};

//update tenant account
export const updateOrganisationInfo = async (
  req: Request,
  res: AuthResponse,
) => {
  if (res.locals.user.tenantId) {
    let fileDoc;
    if (req.body.avatar) {
      fileDoc = await UploadTask.findOne({
        _id: req.body.avatar,
        tenant: res.locals.user.tenantId._id,
        createdBy: res.locals.user._id,
      });
    }
    const updateData: any = {
      name: req.body.name,
      contactPerson: req.body.contactPerson,
      registrationNumber: req.body.registrationNumber,
      officialWebsite: req.body.officialWebsite,
      gstNumber: req.body.gstNumber,
      billingAddressLine1: req.body.billingAddressLine1,
      billingAddressLine2: req.body.billingAddressLine2,
      billingCity: req.body.billingCity,
      billingDistrict: req.body.billingDistrict,
      billingState: req.body.billingState,
      billingPin: req.body.billingPin,
      updatedBy: res.locals.user._id,
    };

    if (fileDoc) {
      const fullPath = await permPath(
        Directory.USER_AVATARS,
        fileDoc.metadata.objectkey,
      );
      await saveThumbnails(fullPath); // Generate and save thumbnails (optional)
      updateData.avatar = fullPath; // Set the full path as the avatar field
      await fileDoc.delete();
    }
    const tenant = await Tenant.findByIdAndUpdate(
      res.locals.user.tenantId,
      updateData,
      {
        new: true,
      },
    );
    res.json({
      status: true,
      message: "Organisation updated successfully.",
      data: tenant,
    });
  } else {
    res.json({
      status: false,
      message: "You can not use this API.",
    });
  }
};

//update organisation email
export const updateOrganisationEmailGetOTP = async (
  req: Request,
  res: AuthResponse,
) => {
  try {
    if (res.locals.user.tenantId) {
      const [alreadyExistingTenant, thisTenant] = await Promise.all([
        Tenant.findOne({ email: req.body.email }),
        Tenant.findById(res.locals.user.tenantId),
      ]);
      if (thisTenant) {
        if (thisTenant.email === req.body.email) {
          res.json({
            status: false,
            message: "You have entered the same email id as the existing one.",
          });
        } else {
          if (alreadyExistingTenant) {
            res.json({
              status: false,
              message: "This email id is already taken by some other client.",
            });
          } else {
            const OTP = 100000 + (randomBytes(3).readUIntBE(0, 3) % 900000); // six digit number
            thisTenant.modefiedEmailRequested = req.body.email;
            thisTenant.modefiedEmailRequestedOTPs = [OTP];
            await thisTenant.save();
            sendMail(
              req.body.email,
              "OTP for email change",
              `Please use the OTP ${OTP} to change your email id`,
              null,
              null,
            );
            res.json({
              status: true,
              message: "OTP generated sucessfully",
            });
          }
        }
      } else {
        res.json({
          status: false,
          message: "Tenant does not exist",
        });
      }
    } else {
      res.json({
        status: false,
        message: "You can not use this API.",
      });
    }
  } catch (err) {
    req.log.error(err);
    res.json({
      status: false,
      message: "server error.",
    });
  }
};

//resend emai OTP
export const updateOrganisationEmailResendOTP = async (
  req: Request,
  res: AuthResponse,
) => {
  if (res.locals.user.tenantId) {
    const thisTenant = await Tenant.findById(res.locals.user.tenantId);
    if (thisTenant) {
      const OTP = 100000 + (randomBytes(3).readUIntBE(0, 3) % 900000); // six digit number
      if (
        thisTenant.modefiedEmailRequested &&
        thisTenant.modefiedEmailRequestedOTPs
      ) {
        thisTenant.modefiedEmailRequestedOTPs.push(OTP);
        await thisTenant.save();
        sendMail(
          thisTenant.modefiedEmailRequested,
          "OTP for email change",
          `Please use the OTP ${OTP} to change your email id`,
          null,
          null,
        );
        res.json({
          status: true,
          message: "OTP sent sucessfully.",
        });
      } else {
        res.json({
          status: false,
          message: "No OTP requested",
        });
      }
    } else {
      res.json({
        status: false,
        message: "Tenant does not exist",
      });
    }
  } else {
    res.json({
      status: false,
      message: "You dont have permission to access this API.",
    });
  }
};

//validate email OTP
export const validateOTPForEmail = async (req: Request, res: AuthResponse) => {
  if (res.locals.user.tenantId) {
    const thisTenant = await Tenant.findById(res.locals.user.tenantId);
    if (thisTenant) {
      if (
        thisTenant.modefiedEmailRequested &&
        thisTenant.modefiedEmailRequestedOTPs !== undefined
      ) {
        if (thisTenant.modefiedEmailRequestedOTPs.includes(req.body.otp)) {
          thisTenant.email = thisTenant.modefiedEmailRequested.toString();
          thisTenant.modefiedEmailRequested = undefined;
          thisTenant.modefiedEmailRequestedOTPs = [];
          await thisTenant.save();
          sendMail(
            thisTenant.email,
            "Email id changed",
            `Email id changed sucessfully. New email id ${thisTenant.email}`,
            null,
            null,
          );
          res.json({
            status: true,
            message: "Email updated sucessfully.",
            data: thisTenant,
          });
        } else {
          res.json({
            status: false,
            message: "Invalid OTP.",
          });
        }
      } else {
        res.json({
          status: false,
          message: "Generate OTP first.",
        });
      }
    } else {
      res.json({
        status: false,
        message: "Tenant does not exist.",
      });
    }
  } else {
    res.json({
      status: false,
      message: "You can not use this API.",
    });
  }
};
