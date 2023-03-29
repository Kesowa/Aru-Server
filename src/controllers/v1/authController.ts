import { Request } from "express";
import { AuthResponse } from "../../utils/interfaceUtils";
import User from "../../models/user";
import UserGroup from "../../models/usergroup";
import { generateResetPasswordToken } from "../../utils/resetPasswordUtils";
import { sendMail } from "../../utils/emailUtil";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { sessionModel } from "../../models/session";
import { IPermission } from "../../schemas/permission";
import { API_SERVER, PUBLIC_SERVER } from "../../constants";
import PassReset from "../../models/passwordReset";
import { tokenEncoder } from "../../utils/authUtils";

//++++++++++++++++++++++++++ user login +++++++++++++++++++++++++++++++++++++++

export const loginUser = async (req: Request, res: AuthResponse) => {
  {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User doesn't exist",
      });
    }
    if (!user.isActive) {
      return res.status(401).json({
        status: false,
        message: "User is not active",
      });
    }

    if (user) {
      if (user.userType != "standalone-user") {
        const isPasswordValid = await user.comparePassword(req.body.password);

        if (isPasswordValid) {
          const deletedSession = await sessionModel.deleteMany({
            owner: user._id,
          });
          const createdSession = await sessionModel.create({ owner: user._id });

          const token = tokenEncoder({
            session: createdSession._id.toJSON(),
            ip: req.ip,
            agent: req.headers["user-agent"],
          });
          const data = user.toObject();

          data.password = "secret";

          if (data.userGroupId) {
            const docs = await UserGroup.findById(data.userGroupId).populate<{
              permissions: IPermission[];
            }>("permissions");
            if (!docs) {
              throw "userGroup not found";
            }
            Object.assign(data, {
              customPermissions: [docs],
              password: undefined,
            });
          }
          if (user.userType == "tenant-client") {
            const date1 = new Date(user.expiryDatee);
            const date2 = new Date(Date.now());
            if (date2 > date1) {
              return res.status(401).json({
                status: false,
                message: "Client has expired",
              });
            } else {
              res.cookie("email", user.email);
              res.json({
                status: true,
                message: "login sucessfully",
                token,
                data,
              });
            }
          } else {
            res.cookie("email", user.email);
            res.json({
              status: true,
              message: "login sucessfully",
              token,
              data,
            });
          }
        } else {
          res.json({
            status: false,
            message: "invalid password.",
          });
        }
      } else {
        res.json({
          status: false,
          message: "The credentials you are trying to log-in with are expired!",
        });
      }
    } else {
      res.json({
        status: false,
        message: "email does not exist.",
      });
    }
  }
};

//++++++++++++++++++++++++++++++++ get user details +++++++++++++++++++++++++++++++++++++++
export const getUserDetails = async (req: Request, res: AuthResponse) => {
  if (res.locals.user.userGroupId) {
    const docs = await UserGroup.findById(
      res.locals.user.userGroupId
    ).populate<{ permissions: IPermission[] }>("permissions");
    if (!docs) {
      return res.status(404).json({
        status: false,
        message: "userGroup not found",
      });
    }
    Object.assign(res.locals.user, {
      customPermissions: [docs],
      password: undefined,
    });
  }

  res.json({
    status: true,
    message: "user details fetched",
    data: res.locals.user,
  });
};

// resetUserPassword

// server side rendered page to change password

export const renderResetPasswordPage = async (
  req: Request,
  res: AuthResponse
) => {
  {
    const token = req.params.token;
    const hash = crypto
      .pbkdf2Sync(token, "", 1000, 64, "sha512")
      .toString("hex");
    const user = await PassReset.findOne({ passwordResetToken: hash });

    if (!user) {
      res.send("Invalid Token");
      return;
    }

    res.statusCode = 200;
    res.setHeader("Content-Type", "text/html");
    res.render("pages/resetPassword", {
      token: token,
      message: "",
    });
  }
};

// send mail to reset password
export const sendForgotPasswordMail = async (
  req: Request,
  res: AuthResponse
) => {
  const email = req.body.email;

  try {
    const user = await User.findOne({ email: email }).lean();

    if (!user) {
      return res.status(201).json({
        status: false,
        message: "Email is not registered",
      });
    }

    const token = await generateResetPasswordToken(email);

    const resetPasswordUrl = `${API_SERVER}/apis/v1/auth/reset-password/${token}`;

    await sendMail(
      email,
      "Password Reset Request || Kesowa Infinite Ventures Pvt. Ltd",
      "",
      `<p><b>Hi user!</b></p>
    <p>We have recieved a request to change password for your account here at ARU.</p>
    <p>In order to reset your password, please <a href=${resetPasswordUrl}>click here!</a>
    <p><b>If this wasn't you, please report at admin@kesowa.com</b></p>
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
      message: "Check Your Mail To Reset Password",
    });
  } catch (error) {
    return res.status(201).json({
      status: false,
      message: "Something Went Wrong! Please try again",
    });
  }
};

// reset password

export const resetPassword = async (req: Request, res: AuthResponse) => {
  {
    const password = req.body.password;
    const password2 = req.body.password2;
    const token = req.params.token;
    if (!password || !password2) {
      res.render("pages/resetPassword", {
        token: token,
        message: "Please Enter Both Fields",
      });
      return;
    }

    if (password !== password2) {
      res.render("pages/resetPassword", {
        token: token,
        message: "Password doesn't match",
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const hash = crypto
      .pbkdf2Sync(token, "", 1000, 64, "sha512")
      .toString("hex");

    const pass = await PassReset.findOne({ passwordResetToken: hash });

    if (!pass) {
      res.render("pages/resetPassword", {
        token: token,
        message: "Invalid Token",
      });
      return;
    }

    const user = await User.findOneAndUpdate(
      { email: pass.email },
      { $set: { password: hashedPassword } }
    );
    const deletedSession = await sessionModel.deleteMany({ owner: user._id });
    await pass.delete();
    res.redirect(PUBLIC_SERVER);
  }
};

// router
// .route("/reset_password")
// .get((req: Request, res: AuthResponse, next:  NextFunction) => {
//   res.statusCode = 200;
//   res.setHeader("Content-Type", "text/html");
//   res.render("resetPassword", {
//     success: req.flash("success"),
//     error: req.flash("error")
//   });
// })
// .post((req: Request, res: AuthResponse, next:  NextFunction) => {
//   const email = req.body.username;
//   users
//     .findOne({ email: email })
//     .then(user => {
//       if (user) {
//         resetPassword(user, req)
//           .then(info => {
//             if (info) {
//               req.log.info(info);
//               return res.render("token", {
//                 success: req.flash("success"),
//                 error: req.flash("error"),
//                 user: user
//               });
//             }
//           })
//           .catch(err => {
//             req.log.error(err);
//           });
//       } else {
//         req.flash("error", "User not found");
//         return res.redirect("reset_password");
//       }
//     })
//     .catch(err => {
//       req.log.error(err);
//     });
// })
