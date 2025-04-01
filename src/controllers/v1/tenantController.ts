import { randomBytes } from "crypto";

import bcrypt from "bcrypt";
import { Request } from "express";
import moment from "moment";
import { Types } from "mongoose";

import Alert from "../../models/alert";
import Document from "../../models/document";
import Layer from "../../models/layer";
import Location from "../../models/location";
import Mission from "../../models/mission";
import Package from "../../models/package";
import Tenant from "../../models/tenant";
import UploadTask from "../../models/uploadTask";
import { AuthResponse } from "../../utils/interfaceUtils";
import {
  createTenantLevelrootUser,
  addPackageToTenant,
} from "../../utils/tenantUtils";
import User from "../../models/user";
import VOD from "../../models/vod";
import UserGroup from "../../models/usergroup";
import layerFiles from "../../models/layerFiles";
import { sendMail } from "../../utils/emailUtil";
import { IUser } from "../../schemas/user";
import { IPackage } from "../../schemas/package";
import newTenant from "../../models/newTenant";
import { findCount, findSize } from "../../utils/mongoUtils";
import { permPath } from "../../utils/dataUtils";
import { Directory } from "../../constants";

//create tenant account
export const createTenant = async (req: Request, res: AuthResponse) => {
  const fileDoc = await UploadTask.findOne({
    _id: req.body.avatar,
    // tenant: res.locals.user.tenantId._id, // As it could be uploaded by super-admin
    createdBy: res.locals.user._id,
    // status: "started",
  });
  
  const [existingTenantWithEmail, existingUserWithEmail] = await Promise.all([
    User.findOne({ email: req.body.email }),
    Tenant.findOne({ email: req.body.email }),
  ]);

  if (!existingTenantWithEmail && !existingUserWithEmail) {
    const tenant = new Tenant({
      name: req.body.name,
      phoneNo: req.body.phoneNo,
      email: req.body.email,
      activePackage: req.body.activePackage,
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
      createdBy: res.locals.user._id,
      updatedBy: res.locals.user._id,
      isActivated: false,
      isActive: true,
    });
    if (fileDoc) {
      const fullPath = await permPath(
        Directory.TENANT_LOGOS,
        fileDoc.metadata.objectkey,
      );
      tenant.avatar = fullPath;
      await fileDoc.delete();
    }
    createTenantLevelrootUser(tenant);
    await tenant.save();

    res.status(201).json({
      status: true,
      message: "Tenant created sucessfully.",
      tenantId: tenant._id,
    });
  } else {
    res.status(400).json({
      status: false,
      message: "Email already in use.",
    });
  }
};

//create tenant account
export const createTenantPublicApi = async (
  req: Request,
  res: AuthResponse,
) => {
  const [existingTenantWithEmail, existingUserWithEmail] = await Promise.all([
    User.findOne({ email: req.body.email }),
    Tenant.findOne({ email: req.body.email }),
  ]);
  // let captcha = req.body.captcha;
  // let response = await fetch(`https://www.google.com/recaptcha/api/siteverify?secret=${process.env.SECRET_KEY}&response=${captcha}`, { method: 'POST' });
  // const result = await response.json();
  // let capFlag = result.success;
  // if (capFlag == false) {
  //     res.json({
  //         status: false,
  //         message: 'Captcha Verfication Failed! Please try again.',
  //     })
  // }
  // else {

  // }

  if (!(existingTenantWithEmail || existingUserWithEmail)) {
    const verificationNumber =
      100000 + (randomBytes(3).readUIntBE(0, 3) % 900000); // six digit number
    await newTenant.findOneAndUpdate(
      { email: req.body.email },
      {
        name: req.body.name,
        phoneNo: req.body.phoneNo,
        email: req.body.email,
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
        // avatar: req.body.avatar ? req.body.avatar : undefined, // avatar file needs to be uploaded to be set as avatar, and uploading file requires authentication, can't be done on a public route
        isActivated: false,
        isActive: false,
        verificationCode: verificationNumber,
        isVerified: false,
        password: await bcrypt.hash(req.body.password, 10),
        // package: req.body.package, // In this flow of steps, new tenant doesn't yet have a package assigned; they will select it after email verification
      },
      {
        upsert: true,
        new: true,
      },
    );

    await sendMail(
      req.body.email,
      "Verification Code! || Kesowa Infinite Ventures Private Limited",
      "",
      `<p><b>Greetings ${req.body.name}!</b></p>
          <p>We wish you a warm welcome from Kesowa Infinite Ventures Private Limited for using our app <b>ARU.</b></p>
          <p>Your one time verification code is <b><h2>${verificationNumber}</h2></b></a>
          <p>Use this code to verify your email and complete you registration</a>
          <p><b>Your userID:</b> ${req.body.email}</p>
          <br/>
          <p><b>Please do not share this email or the password reset link, as it can compromise your account access and organization data!</b></p>
          <br/>
          <p>Best regards,</p>
          <p><b>Team Kesowa</b></p>
          `,
      "",
    );

    res.json({
      status: true,
      message: "Verification code has been sent to your email.",
    });
  } else {
    res.json({
      status: false,
      message: "Email already in use.",
    });
  }
};

export const verifyTenant = async (req: Request, res: AuthResponse) => {
  const tenantData = await newTenant.findOne({ email: req.body.email });
  if (!tenantData) {
    return res.json({
      status: true,
      message: "Verification code expired",
    });
  }
  if (tenantData.verificationCode === req.body.verificationCode) {
    const tenantObj = tenantData.toObject();

    tenantObj.verificationCode =
      100000 + (randomBytes(3).readUIntBE(0, 3) % 900000); // six digit number
    tenantObj.isVerified = true;
    // tenantObj._id = undefined;

    // const session = await mongoose.startSession();
    // session.startTransaction();

    const tenant = new Tenant(tenantObj);

    const user = new User({
      name: tenant.name,
      email: tenant.email,
      phoneNo: tenant.phoneNo,
      userType: "tenant-root",
      isActive: true,
      tenantId: tenant._id,
      password: tenantObj.password,
    });

    const packageData = await Package.findOne({ name: "Trial" });

    if (packageData) {
      tenant.activePackage = packageData._id;
      tenant.bandwidthUsed = 0;
      tenant.packageStartDate = moment().toDate();
      tenant.isActivated = true;
      tenant.isActive = true;
      user.isActive = true;
      await tenant.save();
      await user.save();
    } else {
      await tenant.delete();
      await user.delete();
      return res.json({
        status: false,
        message: "Package not found",
      });
    }

    // await tenant.save({session : session});
    // await user.save({session : session});

    // await session.commitTransaction();
    await tenantData.delete();
    return res.json({
      status: true,
      message: "Tenant Created Successfully",
      data: tenant,
    });
  } else {
    return res.json({
      status: false,
      message: "Invalid Verification Code",
    });
  }
};

export const resendVerificationCode = async (
  req: Request,
  res: AuthResponse,
) => {
  const email = req.body.email;

  const data = await newTenant.findOne({ email: email });

  if (data) {
    await sendMail(
      req.body.email,
      "Account Created! || Kesowa Infinite Ventures Pvt. Ltd",
      "",
      `               
          <p>Your one time verification code is <b><h2>${data.verificationCode}</h2></b>
          <p>Use this code to verify your email and complete you registration</a>
          <p><b>Your userID:</b> ${req.body.email}</p>
          <br/>
          <p><b>Please do not share this email or the password reset link, as it can compromise your account access and organization data!</b></p>
          <br/>
          <p>Best regards,</p>
          <p><b>Team Kesowa</b></p>
          `,
      "",
    );

    res.json({
      status: true,
      message: "Verification code sent",
    });
  } else {
    res.json({
      status: false,
      message: "Session expired please fill the form again",
    });
  }
};

//fetch all tenants
export const fetchAllTenants = async (req: Request, res: AuthResponse) => {
  const tenants = await Tenant.find({})
    .populate<{ createdBy: IUser }>("createdBy", "name")
    .exec();
  res.json({
    status: true,
    message: "Tenants fetched sucessfully.",
    data: tenants,
  });
};

//++++++++++++++++++++add initial package by admin+++++++++++++++++++++++++++++++
export const addInitialPackageByAdmin = async (
  req: Request,
  res: AuthResponse,
) => {
  await addPackageToTenant(req.body.tenantId, req.body.packageId);
  res.json({
    status: true,
    message: "Package added sucessfully.",
  });
};

//fetch tenant details
export const fetchTenantDetails = async (req: Request, res: AuthResponse) => {
  const [tenant, tenantRoot] = await Promise.all([
    Tenant.findById(req.body.tenantId)
      .populate<{ createdBy: IUser }>("createdBy", "name")
      .populate<{ updatedBy: IUser }>("updatedBy", "name")
      .populate<{ activePackage: IPackage }>("activePackage")
      .lean(),
    User.findOne({ tenantId: req.body.tenantId, userType: "tenant-root" })
      .select("name email phoneNo")
      .lean(),
  ]);
  if (tenant && tenantRoot) {
    tenant.tenantRoot = tenantRoot;
  }
  res.json({
    status: true,
    message: "Tenant details fetched sucessfully.",
    data: tenant,
  });
};

export const addAllCountToTenant = async (req: Request, res: AuthResponse) => {
  const missionCount = await findCount(Mission, res.locals.user.tenantId._id);
  const alertCount = await findCount(Alert, res.locals.user.tenantId._id);
  const vodCount = await findCount(VOD, res.locals.user.tenantId._id);
  const layerCount = await findCount(Layer, res.locals.user.tenantId._id);
  const clientCount = await findCount(User, res.locals.user.tenantId._id, {
    userType: "tenant-client",
  });
  const userCount = await findCount(User, res.locals.user.tenantId._id);
  const locationCount = await findCount(Location, res.locals.user.tenantId._id);
  const userGroupCount = await findCount(
    UserGroup,
    res.locals.user.tenantId._id,
  );
  await Tenant.findOneAndUpdate(
    { _id: res.locals.user.tenantId },
    {
      actualUserCount: userCount,
      actualMissionCount: missionCount,
      actualAlertCount: alertCount,
      actualVodCount: vodCount,
      actualLayerCount: layerCount,
      actualClientCount: clientCount,
      actualLocationCount: locationCount,
      actualUserGroupCount: userGroupCount,
    },
    { useFindAndModify: false },
  );
  return res.status(200).json({
    status: true,
    message: "Data updated Successfully!",
  });
};

export const editTenantForId = async (req: Request, res: AuthResponse) => {
  const tenant: any = await Tenant.findById(req.body.tenantId);
  if (tenant) {
    await Tenant.findOneAndUpdate({ _id: req.body.tenantId }, req.body, {
      useFindAndModify: false,
    });
    const result: any = await Tenant.findById(req.body.tenantId);
    return res.status(200).json({
      status: true,
      message: "Data updated Successfully!",
      data: result,
    });
  } else {
    return res.status(404).json({
      status: false,
      message: "Data does not exist!",
    });
  }
};

export const deleteTenantForId = async (req: Request, res: AuthResponse) => {
  const tenant = await Tenant.findOneAndDelete({ _id: req.body.tenantId });
  if (tenant) {
    return res.status(200).json({
      status: true,
      message: "Data deleted Successfully!",
      data: tenant,
    });
  } else {
    return res.status(404).json({
      status: false,
      message: "Data does not exist!",
    });
  }
};

export const addActualSizeToTenant = async (
  req: Request<{}, {}, { tenantId: string }>,
  res: AuthResponse,
) => {
  const tenantId = new Types.ObjectId(req.body.tenantId);
  const documentSum = await findSize(Document, tenantId);
  const alertSum = await findSize(Alert, tenantId);
  const vodSum = await findSize(VOD, tenantId);
  const layerSum = await findSize(Layer, tenantId);
  const layerFileSum = await findSize(layerFiles, tenantId);
  const ActualSize = documentSum + alertSum + vodSum + layerSum + layerFileSum;
  await Tenant.findOneAndUpdate(
    { _id: tenantId },
    {
      actualSize: ActualSize,
      allVodSize: vodSum,
      allAlertSize: alertSum,
      allLayerSize: layerSum,
      allDocumentsSize: documentSum,
      allLayerFileSize: layerFileSum,
    },
    { useFindAndModify: false },
  );
  return res.status(200).json({
    status: true,
    message: "Data updated Successfully!",
  });
};

export const getTenantStats = async (req: Request, res: AuthResponse) => {
  const data = await Tenant.findOne({ _id: res.locals.user.tenantId._id }).populate<{ activePackage: IPackage }>("activePackage");
  if (!data) {
    res.status(404).json({
      status: false,
      message: "Tenant not found",
    });
    return;
  }
  const actualSize = Number(data.actualSize.toString());

  res.json({
    status: true,
    data: {
      actualSize: actualSize,
      actualAlertCount: data.actualAlertCount,
      actualVodCount: data.actualVodCount,
      actualLayerCount: data.actualLayerCount,
      actualClientCount: data.actualClientCount,
      actualLocationCount: data.actualLocationCount,
      actualMissionCount: data.actualMissionCount,
      actualUserCount: data.actualUserCount,
      actualUserGroupCount: data.actualUserGroupCount,
      allVodSize: data.allVodSize,
      allAlertSize: data.allAlertSize,
      allLayerSize: data.allLayerSize + data.allLayerFileSize,
      allDocumentsSize: data.allDocumentsSize,
    },
    packageData: data.activePackage,
  });
};

// REVISIT: What is this for?
export const tenantpublicmaprefupdate = async (
  req: Request,
  res: AuthResponse,
) => {
  const docs = await Tenant.find();
  if (docs.length) {
    for (const tenant of docs) {
      if (tenant.publicMapRef != null || tenant.publicMapRef == undefined) {
        await Tenant.updateOne(
          { _id: tenant._id },
          { publicMapRef: tenant.publicMapRef },
        );
      }
    }
    res.status(200).json({
      status: true,
      message: "All tenant documents modified",
    });
  } else {
    res.status(200).json({
      status: false,
      message: "Oops could not modify the documents",
    });
  }
};
