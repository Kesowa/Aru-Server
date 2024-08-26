import { Request } from "express";
import Tenant from "../../models/tenant";
import { AuthResponse } from "../../utils/interfaceUtils";
import User from "../../models/user";
import bcrypt from "bcrypt";
import ObjectsToCsv from "objects-to-csv";
import { generateResetPasswordToken } from "../../utils/resetPasswordUtils";
import { sendMail } from "../../utils/emailUtil";
import crypto from "crypto";
import { deletePublicFileUsingPath } from "../../utils/fileDeleteUtils";
import { IUser } from "../../schemas/user";
import { API_SERVER, Directory, DirPath, DUMMY_TENANT } from "../../constants";
import { getFileSize } from "../../utils/fileUtils";
import UploadTask from "../../models/uploadTask";
import { permPath } from "../../utils/dataUtils";
import { deleteThumbnails, saveThumbnails } from "../../utils/imageUtils";

//create user account
export const createUser = async (req: Request, res: AuthResponse) => {
  {
    const fileDoc = await UploadTask.findOne({
      _id: req.body.avatar,
      tenant: res.locals.user.tenantId._id,
      createdBy: res.locals.user._id,
      // status: "started",
    });
    const [existingUsertWithEmail] = await Promise.all([
      User.findOne({
        $or: [{ email: req.body.email }, { phoneNo: req.body.phoneNo }],
      }),
    ]);

    if (!existingUsertWithEmail) {
      const temppass = crypto.randomBytes(10).toString("hex");
      const userr = new User({
        name: req.body.name,
        tenantId: res.locals.user.tenantId,
        userGroupId: req.body.userGroupId,
        phoneNo: req.body.phoneNo,
        email: req.body.email,
        password: temppass,
        createdBy: res.locals.user._id,
        updatedBy: res.locals.user._id,
        userType: "tenant-staff",
        dob: req.body.dob,
        aadhaarNo: req.body.aadhaarNo,
        pilotLicenceNo: req.body.pilotLicenceNo,
        avatar: null,
        isBanned: false,
        isActive: true,
      });
      if (fileDoc) {
        const fullPath = await permPath(Directory.USER_AVATARS, fileDoc.metadata.objectkey);
        await saveThumbnails(fullPath);
        userr.avatar = fullPath;
      }
      const dd = await userr.save();
      const tenant = await Tenant.findOne({
        _id: res.locals.user.tenantId,
      });
      if (dd && tenant.actualUserCount >= 0) {
        await Tenant.updateOne(
          { _id: res.locals.user.tenantId },
          { $inc: { actualUserCount: 1 } }
        );
      }

      const email = req.body.email;

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

      res.status(201).json({
        status: true,
        message: "User created! Check email to change password",
        data: userr,
      });
    } else if (
      existingUsertWithEmail &&
      existingUsertWithEmail.isActive == false
    ) {
      const temppass = crypto.randomBytes(10).toString("hex");
      const user = {
        name: req.body.name,
        tenantId: res.locals.user.tenantId,
        userGroupId: req.body.userGroupId,
        phoneNo: req.body.phoneNo,
        email: req.body.email,
        password: temppass,
        createdBy: res.locals.user._id,
        updatedBy: res.locals.user._id,
        userType: "tenant-staff",
        dob: req.body.dob,
        aadhaarNo: req.body.aadhaarNo,
        pilotLicenceNo: req.body.pilotLicenceNo,
        avatar: null,
        isBanned: false,
        isActive: true,
      };
      if (fileDoc) {
        const fullPath = await permPath(Directory.USER_AVATARS, fileDoc.metadata.objectkey);
        await saveThumbnails(fullPath);
        user.avatar = fullPath;
      }
      const dd = await User.findOneAndUpdate(
        { _id: existingUsertWithEmail._id },
        user,
        {
          upsert: true,
          useFindAndModify: false,
        }
      );
      const email = req.body.email;

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

      res.json({
        status: true,
        message: "User created! Check email to change password",
        data: dd,
      });
    } else {
      res.json({
        status: false,
        message: "Email or phone number already in use.",
      });
    }
  }
};

//fetch all users
export const fetchAllUserOfTenant = async (req: Request, res: AuthResponse) => {
  {
    const doc = await User.find({
      tenantId: res.locals.user.tenantId._id,
      userType: { $ne: "tenant-client" },
    }).populate<{
      createdBy: IUser;
    }>("createdBy", "name");
    if (doc.length) {
      res.json({
        status: true,
        message: "Users fetched sucessfully.",
        data: doc,
      });
    } else {
      res.json({
        status: false,
        message: "Users not found",
      });
    }
  }
};

/////Geneate CSV for userlist for tenant

export const userCsv = async (req: Request, res: AuthResponse) => {
  {
    const data = await User.find(
      { tenantId: res.locals.user.tenantId._id },
      { _id: 0, name: 1, email: 1, phoneNo: 1, userType: 1 }
    ).lean();
    if (data.length) {
      const csv = new ObjectsToCsv(data);
      const file = DirPath(
        Directory.CSV,
        `${Math.floor(Math.random() * 62000000)}.csv`
      );
      await csv.toDisk(file);
      res.json({
        status: true,
        message: "Users CSV generated sucessfully.",
        pathh:
          "/" +
          file
            .split(/[\\\/]/)
            .slice(8)
            .join("/"),
      });
    } else
      return res.status(400).json({
        status: false,
        message: "Data does not exist!",
      });
  }
};

export const UserEdit = async (req: Request, res: AuthResponse) => {
  {
    const data = await User.findOne({
      _id: req.body.id,
      tenantId: res.locals.user.tenantId,
    });
    const avatar = req.body.avatar;
    delete req.body.avatar;
    if (req.body.password)
      req.body.password = await bcrypt.hash(req.body.password, 10);
    if (data) {
      const doc = await User.findOneAndUpdate(
        { _id: req.body.id, tenantId: res.locals.user.tenantId },
        {...req.body},
        {
          new: true,
          upsert: true,
          useFindAndModify: false,
        }
      );
      const dd = await User.findOne({
        _id: req.body.id,
        tenantId: res.locals.user.tenantId,
      });
      if (avatar && dd && doc) {
        const fileDoc = await UploadTask.findOne({
          _id: avatar,
          tenant: res.locals.user.tenantId._id,
          createdBy: res.locals.user._id,
          // status: "started",
        });
        if (fileDoc) {
          const fullPath = await permPath(Directory.USER_AVATARS, fileDoc.metadata.objectkey);
          await saveThumbnails(fullPath);
          doc.avatar = fullPath;
          try {
            await deleteThumbnails(data.avatar);
            await deletePublicFileUsingPath(data.avatar);
          } catch (err) {
            req.log.error(err, "failed to delete thumbnails");
          };
          await doc.save();
        }
      }

      return res.status(200).json({
        status: true,
        message: "User data successfully updated!",
        data: doc,
      });
    } else
      return res.status(400).json({
        status: false,
        message: "User data does not match!",
      });
  }
};

export const UserDelete = async (req: Request, res: AuthResponse) => {
  {
    const doc = await User.findOne({
      _id: req.query.id,
      tenantId: res.locals.user.tenantId,
    });
    if (doc) {
      let size = 0;
      try {
        const docPath = DirPath(Directory.ROOT, doc.avatar);
        size = await getFileSize(docPath);
        await deletePublicFileUsingPath(doc.avatar);
        await deleteThumbnails(doc.avatar);
      } catch (error) {
        req.log.error("failed to delete user avatar");
      }
      doc.userType = "standalone-user";
      doc.isActive = false;

      doc.tenantId = DUMMY_TENANT; //dummy tenant id;
      const d = await doc.save();
      // let d = await User.findOneAndDelete({ _id: req.query.id, tenantId: res.locals.user.tenantId });
      const tenant = await Tenant.findOne({
        _id: res.locals.user.tenantId,
      });
      if (d && tenant.actualUserCount) {
        await Tenant.updateOne(
          { _id: res.locals.user.tenantId },
          { $inc: { actualUserCount: -1 } }
        );
        // tenant.actualUserCount = Number(tenant.actualUserCount) - 1;
        // await tenant.save();
      }
      return res.status(200).json({
        status: true,
        message: "User deleted successfully!",
      });
    } else {
      return res.status(400).json({
        status: false,
        message: "User does not exist",
      });
    }
  }
};

export const termsAccepted = async (req: Request, res: AuthResponse) => {
  {
    const terms: any = req.query.terms;
    if (terms == "true") {
      const doc = await User.findOneAndUpdate(
        { _id: res.locals.user._id, tenantId: res.locals.user.tenantId },
        { isTermsAccepted: true },
        { upsert: true, timestamps: false }
      ).lean();
      if (doc) {
        res.status(200).json({
          status: true,
          message: "Terms and Conditions accepted successfully",
          data: doc,
        });
      } else {
        res.status(200).json({
          status: false,
          message: "Somthing went wrong",
        });
      }

      //await User.updateOne({})
    } else {
      res.status(200).json({
        status: true,
        message: "Could not update terms and conditions successfully",
      });
    }
  }
};

export const testTerms = async (req: Request, res: AuthResponse) => {
  {
    const flag: any = req.query.flag;
    if (flag == "go") {
      const docs: any = await User.find({ tenantId: res.locals.user.tenantId });
      if (docs.length) {
        for (let i = 0; i < docs.length; i++) {
          docs[i].isTermsAccepted = false;
          await docs[i].save();
        }
        return res.status(200).json({
          status: true,
          message: "Successfully data updated!",
        });
      } else
        return res.status(404).json({
          status: false,
          message: "No data exist",
        });
    } else
      return res.status(404).json({
        status: false,
        message: "Wrong query arg",
      });
  }
};
