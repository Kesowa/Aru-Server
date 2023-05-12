import { Request } from "express";
import { AuthResponse } from "../../utils/interfaceUtils";
import Usergroup from "../../models/usergroup";
import Mission from "../../models/mission";
import Permission from "../../models/permission";
import User from "../../models/user";
import bcrypt from "bcrypt";
import Flight from "../../models/flight";
import Tenant from "../../models/tenant";
import ObjectsToCsv from "objects-to-csv";
import crypto, { randomUUID } from "crypto";
import { generateResetPasswordToken } from "../../utils/resetPasswordUtils";
import { sendMail } from "../../utils/emailUtil";
import { deletePublicFileUsingPath } from "../../utils/fileDeleteUtils";
import { copyFiled } from "../../utils/moveFileUtils";
import { IUser } from "../../schemas/user";
import { IMission } from "../../schemas/mission";
import { ILocation } from "../../schemas/location";
import { API_SERVER, Directory, DirPath, DUMMY_TENANT } from "../../constants";
import { SortOrder } from "mongoose";
import { getFileSize } from "../../utils/fileUtils";
import s3fs from "../../s3utils/lib-aws";

export const createClientformissionGroup = async (
  req: Request,
  res: AuthResponse
) => {
  {
    const result = await Usergroup.findOne(
      {
        _id: req.body.userGroupId,
      },
      {
        permissions: 1,
      }
    );
    if (result) {
      let cflag = 0;
      let cId;
      const permission = await Permission.findOne(
        {
          _id: { $in: result.permissions },
          isClient: true,
        },
        { _id: 1 }
      );
      if (permission) {
        const existingClient = await User.findOne(
          { email: req.body.email },
          { _id: 1 }
        );
        if (existingClient) {
          cflag = 1;
          cId = existingClient._id;
        }

        if (cflag == 1) {
          const temppass = crypto.randomBytes(10).toString("hex");
          const date2 = new Date(req.body.expiryDate);
          // let docPath = DirPath(Directory.DEFAULT, req.body.avatar);
          // let size: number = await getFileSize(docPath);

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
            avatar: req.body.avatar ? req.body.avatar : undefined,
            isBanned: false,
            isActive: true,
            city,
            country,
          };
          await User.findOneAndUpdate({ _id: cId }, modClient, {
            upsert: true,
            useFindAndModify: false,
          });
          const modDoc = await User.findOne({ _id: cId });
          if (req.body.avatar && modDoc) {
            copyFiled(
              req.body.avatar,
              `/images/client/${req.body.avatar.split(/[\\\/]/)[3]}`
            );
          }
          if (req.body.avatar && modDoc) {
            modDoc.avatar = `/images/client/${
              req.body.avatar.split(/[\\\/]/)[3]
            }`;
            await modDoc.save();
          }
          if (req.body.avatar && modDoc) {
            await deletePublicFileUsingPath(req.body.avatar);
          }
          // let tenant: any = await Tenant.findOne({ _id: res.locals.user.tenantId });
          // if (modDoc && tenant.actualClientCount >= 0) {
          //   await Tenant.updateOne({ _id: res.locals.user.tenantId},{ $inc: { actualClientCount: 1 } })
          //   // tenant.actualClientCount = Number(tenant.actualClientCount) + 1;
          //   // await tenant.save();
          // }

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
            ""
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
          const createDoc = await newClient.save();
          const docPath = DirPath(Directory.DEFAULT, req.body.avatar);
          if (req.body.avatar && createDoc) {
            copyFiled(
              req.body.avatar,
              `/images/client/${req.body.avatar.split(/[\\\/]/)[3]}`
            );
          }
          if (req.body.avatar && createDoc) {
            createDoc.avatar = `/images/client/${
              req.body.avatar.split(/[\\\/]/)[3]
            }`;
            await createDoc.save();
          }
          if (req.body.avatar && createDoc) {
            await deletePublicFileUsingPath(req.body.avatar);
          }
          const tenant = await Tenant.findOne(
            {
              _id: res.locals.user.tenantId,
            },
            {
              actualClientCount: 1,
            }
          );
          if (createDoc && tenant.actualClientCount >= 0) {
            await Tenant.updateOne(
              { _id: res.locals.user.tenantId },
              { $inc: { actualClientCount: 1 } }
            );
            // tenant.actualClientCount = Number(tenant.actualClientCount) + 1;
            // await tenant.save();
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
            ""
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
  }
};

export const getMissionById = async (req: Request, res: AuthResponse) => {
  {
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
    //let tempResult:Array<any>=[];
    let result: any;
    let resultt: any;
    let data: any;
    if (req.query.status == "Upcoming" || req.query.status == "Completed") {
      resultt = await Mission.find({
        clientId: req.query.clientId,
        status: match.status,
        tenantId: res.locals.user.tenantId,
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
        })
      );
    } else if (req.query.status == "All") {
      resultt = await Mission.find({
        clientId: req.query.clientId,
        tenantId: res.locals.user.tenantId,
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
        })
      );
    }
    const q: number = req.query.limit ? Number(req.query.limit) : 10;
    const p: number = req.query.page ? Number(req.query.page) * q : 0;
    if (result.length) {
      for (let i = 0; i < result.length; i++) {
        ar.push(result[i]);
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
          return res.json({
            status: true,
            message: `Your data must be less than equal to ${
              result.length - 1
            }`,
            data: result,
          });
      } else
        return res.status(404).json({
          status: false,
          message: "sorry client expired!",
        });
    } else
      return res.status(200).json({
        status: false,
        message: "Data does not exist!",
      });
  }
};

export const editClientDetails = async (req: Request, res: AuthResponse) => {
  {
    const result: any = await User.findOne(
      {
        _id: req.body.id,
        tenantId: res.locals.user.tenantId,
      },
      {
        avatar: 1,
      }
    );
    if (req.body.password)
      req.body.password = await bcrypt.hash(req.body.password, 10);
    if (req.body.expiryDate) req.body.expiryDatee = req.body.expiryDate;
    if (result) {
      let bSavePath;
      if (req.body.avatar) {
        bSavePath = result.avatar;
      }
      const doc: Array<any> = await User.findOneAndUpdate(
        { _id: req.body.id, tenantId: res.locals.user.tenantId },
        req.body,
        {
          new: true,
          upsert: true,
          useFindAndModify: false,
        }
      );
      const modDoc: any = await User.findOne({
        _id: req.body.id,
        tenantId: res.locals.user.tenantId,
      });
      if (req.body.avatar && modDoc && doc) {
        const a = new String(String(req.body.avatar)).valueOf();
        const b = new String(String(bSavePath)).valueOf();
        if (a !== b) {
          copyFiled(
            req.body.avatar,
            `/images/client/${req.body.avatar.split(/[\\\/]/)[3]}`
          );
          modDoc.avatar = `/images/client/${
            req.body.avatar.split(/[\\\/]/)[3]
          }`;
          await modDoc.save();
          await deletePublicFileUsingPath(req.body.avatar);
          await deletePublicFileUsingPath(bSavePath);
        }
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
  }
};

export const deleteCientforTenant = async (req: Request, res: AuthResponse) => {
  {
    const doc = await User.findOne({
      _id: req.body.id,
      tenantId: res.locals.user.tenantId,
    });
    if (doc) {
      const _updatedMissions = await Mission.updateMany(
        {
          clientId: req.body.id,
          tenantId: res.locals.user.tenantId,
        },
        {
          $pull: {
            clientId: req.body.id,
          },
        }
      );
      let size = 0;
      try {
        const docPath = DirPath(Directory.DEFAULT, doc.avatar);
        size = await getFileSize(docPath);
        await deletePublicFileUsingPath(doc.avatar);
      } catch (error) {
        req.log.warn("failed to delete client avatar");
      }
      doc.userType = "standalone-user";
      doc.isActive = false;

      doc.tenantId = DUMMY_TENANT; //dummy tenant id
      const d = await doc.save();
      const tenant: any = await Tenant.findOne(
        {
          _id: res.locals.user.tenantId,
        },
        {
          actualClientCount: 1,
        }
      );
      if (d && tenant.actualClientCount) {
        await Tenant.updateOne(
          { _id: res.locals.user.tenantId },
          { $inc: { actualClientCount: -1 } }
        );
        // tenant.actualClientCount = Number(tenant.actualClientCount) - 1;
        // await tenant.save();
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
  }
};

export const insertClientforMission = async (
  req: Request,
  res: AuthResponse
) => {
  {
    const doc: Array<any> = await Mission.find(
      {
        _id: req.body.missionId,
        tenantId: res.locals.user.tenantId,
      },
      {
        clientId: 1,
      }
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
        for (let i = 0; i < clientArr.length; i++) {
          const result: Array<any> = await User.find(
            {
              _id: clientArr[i],
              tenantId: res.locals.user.tenantId,
            },
            { _id: 1 }
          );
          if (result.length) {
            if (arr.includes(clientArr[i])) {
              faultArray.push(clientArr[i]);
            } else {
              arr.push(clientArr[i]);
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
          { clientId: arr }
        );
        if (save) {
          const data: any = [];
          for (let i = 0; i < arr.length; i++) {
            data.push(await User.findOne({ _id: arr[i] }));
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
  }
};

export const removeClientfromMission = async (
  req: Request,
  res: AuthResponse
) => {
  {
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
      }
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
  }
};

export const clientCsv = async (req: Request, res: AuthResponse) => {
  {
    const result: Array<any> = await User.find(
      {
        tenantId: res.locals.user.tenantId,
        userType: "tenant-client",
      },
      {
        name: 1,
        email: 1,
        phoneNo: 1,
      }
    )
      .sort({ createdAt: -1 })
      .populate<{ createdBy: IUser }>({ path: "createdBy", select: "name" })
      .lean();
    const savedResult: any = [];
    if (result.length) {
      for (let i = 0; i < result.length; i++) {
        const d = {
          name: result[i].name,
          email: result[i].email,
          phoneNumber: result[i].phoneNo,
        };
        savedResult.push(d);
      }

      const csv = new ObjectsToCsv(savedResult);
      const file = DirPath(Directory.CSV, `${randomUUID()}.csv`);
      const data = await csv.toString();
      await s3fs.writeFile(file, data);
      return res.status(200).json({
        status: true,
        message: "Client CSV generated successfully!",
        pathh: "/" + file,
      });
    } else
      return res.status(400).json({
        status: false,
        message: "Data does not exist!",
      });
  }
};

// export let getListClient = async(req: Request,res: AuthResponse,next:NextFunction)=>{
//     try {
//         let result:Array<any> = await User.find({tenantId:res.locals.user.tenantId, userType:'tenant-client'}).sort({createdAt:-1}).populate({path:"createdBy",select:"name"}).lean();

//         let newResult = await Promise.all(result.map(async (client) => {
//             let count = await Mission.aggregate(getNumberOfMissions(client._id));

//             return {
//                 ...client,
//                 count
//             }
//         }))

//         if(result.length){
//             return res.status(200).json({
//                 status:true,
//                 message:"Data fetched successfully!",
//                 data:newResult
//             })

//         }else return res.status(200).json({
//             status:false,
//             message:"Data does not exist!"
//         })
//     } catch (error) {
//         req.log.error(error);
//         return res.status(500).json({
//             status:false,
//             message:"Server error!"
//         })
//     }
// }

export const getListClient = async (req: Request, res: AuthResponse) => {
  {
    const page = Number(req.query.page) - 1;
    const limit = Number(req.query.limit);
    const [sortBy, order] = (req.query.sort?.toString() || "name:desc").split(
      ":"
    );

    const results = await User.find({
      tenantId: res.locals.user.tenantId,
      userType: "tenant-client",
    })
      .populate<{ createdBy: IUser }>({ path: "createdBy", select: "name" })
      .collation({ locale: "en" })
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
    const tenant = await Tenant.findById(res.locals.user.tenantId._id, {
      actualClientCount: 1,
    });
    return res.json({
      status: true,
      message: "Data fetched successfully!",
      data: results,
      total: tenant.actualClientCount,
    });
  }
};

export const devApiClientArr = async (req: Request, res: AuthResponse) => {
  {
    const docs = await Mission.find(
      {
        tenantId: req.body.tenantId,
      },
      {
        clientId: 1,
      }
    );
    if (docs.length) {
      for (let i = 0; i < docs.length; i++) {
        if (!(docs[i].clientId instanceof Array) && docs[i].clientId != null) {
          // docs[i].clientId = [docs[i].clientId];
          // docs[i].save();
          await Mission.updateOne(
            { _id: docs[i]._id },
            { $set: { clientId: [docs[i].clientId] } }
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
  }
};

export const getClientByEmail = async (req: Request, res: AuthResponse) => {
  {
    const email = req.query.email;
    if (!email) {
      return res.status(400).json({
        status: false,
        message: "no email supplied",
      });
    }
    const client = await User.findOne({ email: email }, { email: 1, name: 1 });
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
  }
};
