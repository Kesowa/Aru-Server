import crypto from "crypto";
import path from "path";

import bcrypt from "bcrypt";

import { IUser } from "../../schemas/user";
import { IMission } from "../../schemas/mission";
import { ILocation } from "../../schemas/location";
import {
  API_SERVER,
  Directory,
  DirPath,
  DUMMY_TENANT,
  SECRET_KEY,
} from "../../constants";
import { SortOrder } from "mongoose";
import { getFileSize } from "../../utils/fileUtils";
import ejs from "ejs";
import { Request } from "express";
import Flight from "../../models/flight";
import Mission from "../../models/mission";
import Tenant from "../../models/tenant";
import UploadTask from "../../models/uploadTask";
import User from "../../models/user";
import Usergroup from "../../models/usergroup";
import { PERMS, TENANT_CLIENT_PERMS } from "../../schemas/permission";
import { iv } from "../../utils/authUtils";
import { permPath, saveCSV } from "../../utils/dataUtils";
import { sendMail } from "../../utils/emailUtil";
import { deletePublicFileUsingPath } from "../../utils/fileDeleteUtils";
import { saveThumbnails } from "../../utils/imageUtils";
import { AuthResponse } from "../../utils/interfaceUtils";
import { generateResetPasswordToken } from "../../utils/resetPasswordUtils";

export const createClientformissionGroup = async (
  req: Request,
  res: AuthResponse,
) => {
  let fileDoc;
  if (req.body.avatar) {
    fileDoc = await UploadTask.findOne({
      _id: req.body.avatar,
      tenant: res.locals.user.tenantId._id,
      createdBy: res.locals.user._id,
      // status: "started",
    });
  }
  const result = await Usergroup.findOne({
    _id: req.body.userGroupId,
    tenantId: res.locals.user.tenantId._id,
  });
  const onlyClientPerms = result.permissions.every((perm) =>
    TENANT_CLIENT_PERMS.includes(perm),
  );
  if (result) {
    if (onlyClientPerms) {
      const existingClient = await User.findOne({
        email: req.body.email,
        tenantId: res.locals.user.tenantId._id,
      });

      if (existingClient) {
        const temppass = crypto.randomBytes(10).toString("hex");
        const date2 = new Date(req.body.expiryDate);

        const { name, email, phoneNo, userGroupId, userType, country, city } =
          req.body;
        const modClient = {
          name,
          email,
          phoneNo,
          userGroupId,
          userType,
          expiryDatee: date2,
          password: temppass,
          tenantId: res.locals.user.tenantId,
          createdBy: res.locals.user._id,
          updatedBy: res.locals.user._id,
          avatar: null,
          isBanned: false,
          isActive: true,
          city,
          country,
        };
        if (fileDoc) {
          const fullPath = await permPath(
            Directory.USER_AVATARS,
            fileDoc.metadata.objectkey,
          );
          await saveThumbnails(fullPath);
          modClient.avatar = fullPath;
          await fileDoc.delete();
        }
        await User.findOneAndUpdate({ _id: existingClient._id }, modClient, {
          upsert: true,
          useFindAndModify: false,
        });
        const modDoc = await User.findOne({ _id: existingClient._id });

        const token = await generateResetPasswordToken(email);
        const resetPasswordUrl = `${API_SERVER}/apis/v1/auth/reset-password/${token}`;

        await sendMail(
          email,
          "Account Created! || Kesowa Infinite Ventures Pvt. Ltd",
          "",
          `<p><b>Greetings ${req.body.name}!</b></p>
                  <p>We wish you a warm welcome from Kesowa Infinite Ventures Pvt. Ltd for using our app <b>ARU.</b></p>
                  <p>In order to complete your account creation process, which was initiated by your organization admin, please <a href=${resetPasswordUrl}>click here to reset your password first!</a>
                  <p><b>Your userID:</b> ${req.body.email}</p>
                  <br/>
                  <p><b>Please do not share this email or the password reset link, as it can compromise your account access and organization data!</b></p>
                  <br/>
                  <p>Best regards,</p>
                  <p><b>Team Kesowa</b></p>
                  `,
          "",
        );

        return res.status(201).json({
          status: true,
          message: "Client created! Check email to change password",
          data: modDoc,
        });
      } else {
        const temppass = crypto.randomBytes(10).toString("hex");
        const date2 = new Date(req.body.expiryDate);
        const { name, email, phoneNo, userGroupId, userType, country, city } =
          req.body;
        const newClient = new User({
          name,
          email,
          phoneNo,
          userGroupId,
          userType,
          expiryDatee: date2,
          password: temppass,
          tenantId: res.locals.user.tenantId,
          createdBy: res.locals.user._id,
          updatedBy: res.locals.user._id,
          avatar: req.body.avatar ? req.body.avatar : undefined,
          isBanned: false,
          isActive: true,
          city,
          country,
        });
        if (fileDoc) {
          const fullPath = await permPath(
            Directory.USER_AVATARS,
            fileDoc.metadata.objectkey,
          );
          await saveThumbnails(fullPath);
          newClient.avatar = fullPath;
          await fileDoc.delete();
        }
        const createDoc = await newClient.save();
        const tenant = await Tenant.findOne(
          {
            _id: res.locals.user.tenantId,
          },
          {
            actualClientCount: 1,
          },
        );
        if (createDoc && tenant.actualClientCount >= 0) {
          await Tenant.updateOne(
            { _id: res.locals.user.tenantId },
            { $inc: { actualClientCount: 1 } },
          );
        }
        const token = await generateResetPasswordToken(email);
        const resetPasswordUrl = `${API_SERVER}/apis/v1/auth/reset-password/${token}`;

        await sendMail(
          email,
          "Account Created! || Kesowa Infinite Ventures Pvt. Ltd",
          "",
          `<p><b>Greetings ${req.body.name}!</b></p>
                  <p>We wish you a warm welcome from Kesowa Infinite Ventures Pvt. Ltd for using our app <b>ARU.</b></p>
                  <p>In order to complete your account creation process, which was initiated by your organization admin, please <a href=${resetPasswordUrl}>click here to reset your password first!</a>
                  <p><b>Your userID:</b> ${req.body.email}</p>
                  <br/>
                  <p><b>Please do not share this email or the password reset link, as it can compromise your account access and organization data!</b></p>
                  <br/>
                  <p>Best regards,</p>
                  <p><b>Team Kesowa</b></p>
                  `,
          "",
        );

        return res.status(201).json({
          status: true,
          message: "Client created! Check email to change password",
          data: createDoc,
        });
      }
    } else
      return res.status(400).json({
        status: false,
        message: "Permissions does not have client privilages",
      });
  } else
    return res.status(400).json({
      status: false,
      message: "Usergroups Id does not match!",
    });
};

export const getMissionById = async (req: Request, res: AuthResponse) => {
  const sort: any = {};
  const match: any = {};
  if (req.query.status) {
    match.status = req.query.status;
  }
  if (req.query.createdAt) {
    sort.createdAt = req.query.createdAt === "desc" ? -1 : 1;
  } else sort.createdAt = -1;
  const d: Array<any> = [];
  const ar: Array<any> = [];
  let result: any;
  let resultt: any;
  let data: any;
  if (req.query.status == "Upcoming" || req.query.status == "Completed") {
    resultt = await Mission.find({
      clientId: res.locals.user._id, // should work as intended user of the route is a client
      status: match.status,
      tenantId: res.locals.user.tenantId._id,
    })
      .populate<{ clientId: IUser }>("clientId")
      .populate<{ missionType: IMission }>("missionType")
      .sort(sort)
      .lean();
    result = await Promise.all(
      resultt.map(async (mission: any) => {
        data = await Flight.findOne({ mission: mission._id })
          .populate<{ locationID: ILocation }>("locationID")
          .populate<{ pilotID: IUser }>("pilotID")
          .lean();
        return {
          ...mission,
          ["flight"]: data,
        };
      }),
    );
  } else if (req.query.status == "All") {
    resultt = await Mission.find({
      clientId: res.locals.user._id, // should work as intended user of the route is a client
      tenantId: res.locals.user.tenantId._id,
    })
      .populate<{ clientId: IUser }>("clientId")
      .populate<{ missionType: IMission }>("missionType")
      .populate<{ user: IUser }>("user")
      .sort(sort)
      .lean();
    result = await Promise.all(
      resultt.map(async (mission: any) => {
        data = await Flight.findOne({ mission: mission._id })
          .populate<{ pilotID: IUser }>("pilotID")
          .lean();
        return {
          ...mission,
          ["flight"]: data,
        };
      }),
    );
  }
  const q: number = req.query.limit ? Number(req.query.limit) : 10;
  const p: number = req.query.page ? Number(req.query.page) * q : 0;
  if (result.length) {
    for (const m of result) {
      ar.push(m);
    }
    if (ar.length) {
      if (p * q + q < ar.length + 1) {
        for (let i = p * q; i < p * q + q; i++) {
          d.push(ar[i]);
        }
        return res.status(200).json({
          status: true,
          message: "Mission Data fetched successfully",
          data: d,
        });
      } else
        return res.status(206).json({
          status: true,
          message: `Your data must be less than equal to ${result.length - 1}`,
          data: result,
        });
    } else
      return res.status(404).json({
        status: false,
        message: "sorry client expired!",
      });
  } else
    return res.status(404).json({
      status: false,
      message: "Data does not exist!",
    });
};

export const editClientDetails = async (req: Request, res: AuthResponse) => {
  let fileDoc;
  if (req.body.avatar) {
    fileDoc = await UploadTask.findOne({
      _id: req.body.avatar,
      tenant: res.locals.user.tenantId._id,
      createdBy: res.locals.user._id,
      // status: "started",
    });
  }
  const result = await User.findOne(
    {
      _id: req.body.id,
      tenantId: res.locals.user.tenantId,
    },
    {
      avatar: 1,
    },
  );
  if (req.body.password)
    req.body.password = await bcrypt.hash(req.body.password, 10);
  if (req.body.expiryDate) req.body.expiryDatee = req.body.expiryDate;
  if (result) {
    const doc = await User.findOneAndUpdate(
      { _id: req.body.id, tenantId: res.locals.user.tenantId },
      req.body,
      {
        new: true,
        upsert: true,
        useFindAndModify: false,
      },
    );
    const modDoc = await User.findOne({
      _id: req.body.id,
      tenantId: res.locals.user.tenantId,
    });
    if (req.body.avatar && modDoc && doc) {
      if (fileDoc) {
        const fullPath = await permPath(
          Directory.USER_AVATARS,
          fileDoc.metadata.objectkey,
        );
        await saveThumbnails(fullPath);
        modDoc.avatar = fullPath;
        await fileDoc.delete();
      }
      await modDoc.save();
    }

    return res.status(200).json({
      status: true,
      message: "Client data successfully updated!",
      data: modDoc,
    });
  } else
    return res.status(400).json({
      status: false,
      message: "clientId does not match!",
    });
};

export const clientReactivationMail = async (
  user: { email: string; name: string },
  client: { email: string; name: string },
) => {
  const cipher = crypto.createCipheriv(
    "aes-256-gcm",
    Buffer.from(SECRET_KEY, "base64"),
    iv,
  );
  let token = cipher.update(client.email, "utf8", "base64");
  token += cipher.final("base64");
  token = encodeURIComponent(token);
  const reactivateClientUrl = `${API_SERVER}/apis/v1/client/reactivate-client/${token}`;
  const html = await ejs.renderFile(
    path.join(
      __dirname,
      "..",
      "..",
      "views",
      "mails",
      "clientDeletionNotification.ejs",
    ),
    {
      name: user.name,
      reactivateClientUrl,
    },
    { async: true },
  );
  await sendMail(
    user.email,
    "Client Deletion Notification || Kesowa Infinite Ventures Pvt. Ltd",
    "",
    html,
    "",
  );
};

export const deleteCientforTenant = async (
  req: Request<{}, {}, { id: string }>,
  res: AuthResponse,
) => {
  const doc = await User.findOne({
    _id: req.body.id,
    tenantId: res.locals.user.tenantId,
  });
  if (doc) {
    await Mission.updateMany(
      {
        clientId: req.body.id,
        tenantId: res.locals.user.tenantId,
      },
      {
        $pull: {
          clientId: req.body.id,
        },
      },
    );
    try {
      const docPath = DirPath(Directory.ROOT, doc.avatar);
      await getFileSize(docPath);
      await deletePublicFileUsingPath(doc.avatar);
    } catch (error) {
      req.log.warn("failed to delete client avatar");
    }
    doc.userType = "standalone-user";
    doc.isActive = false;

    doc.tenantId = DUMMY_TENANT; //dummy tenant id
    const d = await doc.save();
    const tenant = await Tenant.findOne(
      {
        _id: res.locals.user.tenantId,
      },
      {
        actualClientCount: 1,
      },
    );
    if (d && tenant.actualClientCount) {
      await Tenant.updateOne(
        { _id: res.locals.user.tenantId },
        { $inc: { actualClientCount: -1 } },
      );
    }

    try {
      const creator = await User.findById(doc.createdBy);
      await clientReactivationMail(creator, doc);
    } catch (error) {
      req.log.error("failed to send email to the creator");
      req.log.error(error);
    }

    return res.status(200).json({
      status: true,
      message: "client deleted successfully!",
      data: d,
    });
  } else
    return res.status(400).json({
      status: false,
      message: "clientId does not match!",
    });
};

export const reactivateClient = async (req: Request, res: AuthResponse) => {
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    Buffer.from(SECRET_KEY, "base64"),
    iv,
  );
  let email = decipher.update(req.params.token, "base64", "utf8");
  email += decipher.final("utf8");

  const client = await User.findOne({
    email: email,
    userType: "standalone-user",
    isActive: false,
    tenantId: DUMMY_TENANT,
  });
  if (client) {
    const creator = await User.findById(client.createdBy);

    client.userType = "tenant-client";
    client.isActive = true;
    client.tenantId = creator.tenantId;
    client.expiryDatee = new Date(
      new Date().getTime() + 1000 * 60 * 60 * 24 * 365.25,
    );

    const d = await client.save();

    const tenant = await Tenant.findOne(
      {
        _id: creator.tenantId,
      },
      {
        actualClientCount: 1,
      },
    );
    if (d && tenant.actualClientCount) {
      await Tenant.updateOne(
        { _id: creator.tenantId },
        { $inc: { actualClientCount: 1 } },
      );
    }

    return res.render("pages/client_reactivate", {
      isSuccess: true,
      name: client.name,
    });
  } else {
    req.log.error("Client either doesn't exist or is not deactivated!");
    return res.render("pages/client_reactivate", {
      isSuccess: false,
    });
  }
};

export const insertClientforMission = async (
  req: Request,
  res: AuthResponse,
) => {
  const doc: Array<any> = await Mission.find(
    {
      _id: req.body.missionId,
      tenantId: res.locals.user.tenantId,
    },
    {
      clientId: 1,
    },
  );
  const trigger = false;
  let arr: any = [];
  const faultArray: any = [];
  if (doc.length) {
    arr = doc[0].clientId;
    if (arr == null) {
      arr = [];
    }
    let clientArr: any = [];
    clientArr = req.body.clientId;
    if (req.body.clientId.length > 0) {
      for (const clientId of clientArr) {
        const result: Array<any> = await User.find(
          {
            _id: clientId,
            tenantId: res.locals.user.tenantId,
          },
          { _id: 1 },
        );
        if (result.length) {
          if (arr.includes(clientId)) {
            faultArray.push(clientId);
          } else {
            arr.push(clientId);
          }
        } else {
          return res.status(400).json({
            status: false,
            message: "Client does not exist",
          });
        }
      }
      const save: any = await Mission.updateOne(
        { _id: req.body.missionId },
        { clientId: arr },
      );
      if (save) {
        const data: any = [];
        for (const clientId of arr) {
          data.push(await User.findOne({ _id: clientId }));
        }
        return res.status(200).json({
          status: true,
          message: "Client inserted successfully!",
          data: data,
          existingClients: faultArray,
        });
      }
    } else {
      return res.status(200).json({
        status: false,
        message: "Please pass atleast one client",
      });
    }
  } else {
    return res.status(400).json({
      status: false,
      message: "missionId does not match!",
    });
  }
};

export const removeClientfromMission = async (
  req: Request,
  res: AuthResponse,
) => {
  const doc = await Mission.findOneAndUpdate(
    {
      _id: req.query.id,
      tenantId: res.locals.user.tenantId,
    },
    {
      $pull: {
        clientId: req.query.clientId,
      },
    },
    {
      safe: true,
      multi: true,
    },
  );
  if (doc) {
    res.json({
      status: true,
      message: `Client removed for MissionId:${req.query.id}`,
      data: doc,
    });
  } else {
    res.json({
      status: false,
      message: "Mission does not exist",
    });
  }
};

export const clientCsv = async (req: Request, res: AuthResponse) => {
  const result: Array<any> = await User.find(
    {
      tenantId: res.locals.user.tenantId._id,
      userType: "tenant-client",
    },
    {
      name: 1,
      email: 1,
      phoneNo: 1,
    },
  )
    .sort({ createdAt: -1 })
    .populate<{ createdBy: IUser }>({ path: "createdBy", select: "name" })
    .lean();
  const savedResult: any = [];
  if (result.length) {
    for (const client of result) {
      const d = {
        name: client.name,
        email: client.email,
        phoneNumber: client.phoneNo,
      };
      savedResult.push(d);
    }

    const filename = "clients-" + String(res.locals.user.tenantId._id) + ".csv";
    const { filepath } = await saveCSV(
      filename,
      savedResult,
      "",
      res.locals.user.tenantId._id,
      res.locals.user._id,
    );
    return res.status(200).json({
      status: true,
      message: "Client CSV generated successfully!",
      pathh: filepath,
    });
  } else
    return res.status(400).json({
      status: false,
      message: "Data does not exist!",
    });
};

export const getListClient = async (req: Request, res: AuthResponse) => {
  const {
    name,
    email,
    phoneNo,
    country,
    city,
  } = req.query;
  const page = Number(req.query.page) - 1;
  const limit = Number(req.query.limit);
  const [sortBy, order] = (req.query.sort?.toString() || "name:desc").split(
    ":",
  );

  const query = {
    tenantId: res.locals.user.tenantId._id,
    userType: "tenant-client",
    [name && "name"]: { $regex: name, $options: 'i' },
    [email && "email"]: email,
    [phoneNo && "phoneNo"]: phoneNo,
    [country && "country"]: { $regex: country, $options: 'i' },
    [city && "city"]: { $regex: city, $options: 'i' },
  };

  const results = await User.find(query)
    .populate<{ createdBy: IUser }>({ path: "createdBy", select: "name" })
    .sort({ [sortBy]: order as SortOrder })
    .skip(limit * page)
    .limit(limit)
    .lean();
  if (!results) {
    return res.status(200).json({
      status: false,
      message: "No Client Found",
    });
  }
  // queries the database and fetches the count only, not the data, so should be optimal even though kinda repetative
  const total = await User.count(query);
  return res.json({
    status: true,
    message: "Data fetched successfully!",
    data: results,
    total,
  });
};

export const devApiClientArr = async (req: Request, res: AuthResponse) => {
  const docs = await Mission.find(
    {
      tenantId: req.body.tenantId,
    },
    {
      clientId: 1,
    },
  );
  if (docs.length) {
    for (const mission of docs) {
      if (!(mission.clientId instanceof Array) && mission.clientId != null) {
        await Mission.updateOne(
          { _id: mission._id },
          { $set: { clientId: [mission.clientId] } },
        );
        req.log.info("updated");
      } else {
        req.log.info("skipping");
      }
    }
    return res.send("Updated");
  } else {
    return res.send("No docs");
  }
};

export const getClientByEmail = async (req: Request, res: AuthResponse) => {
  const email = req.query.email;
  if (!email) {
    return res.status(400).json({
      status: false,
      message: "no email supplied",
    });
  }
  const client = await User.findOne(
    { email: email, tenantId: res.locals.user.tenantId._id },
    { email: 1, name: 1 },
  );
  if (!client) {
    return res.status(404).json({
      status: false,
      message: "no client found",
    });
  }
  return res.json({
    status: true,
    message: "client found",
    data: client,
  });
};

export const getClientById = async (req: Request, res: AuthResponse) => {
  const doc = await User.findOne({
    _id: req.query.id,
    tenantId: res.locals.user.tenantId._id,
    userType: "tenant-client",
  }).populate<{
    createdBy: IUser;
  }>("createdBy", "name");
  if (doc) {
    if (!res.locals.user.customPermissions.includes(PERMS.EDIT_CLIENT)) {
      // personal details to be viewed only for editing purpose
      // otherwise hidden
      doc.phoneNo = null;
      doc.email = null;
      doc.password = null;
      doc.dob = null;
      doc.aadhaarNo = null;
      doc.pilotLicenceNo = null;
      doc.city = null;
      doc.country = null;
      doc.expiryDatee = null;
      doc.avatar = null;
      doc.passwordResetToken = null;
    }
    res.json({
      status: true,
      message: "Client fetched sucessfully.",
      data: doc,
    });
  } else {
    res.json({
      status: false,
      message: "Client not found",
    });
  }
};
