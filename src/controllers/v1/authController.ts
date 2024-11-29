import { Request } from "express";
import { AuthResponse } from "../../utils/interfaceUtils";
import User from "../../models/user";
import { generateResetPasswordToken } from "../../utils/resetPasswordUtils";
import { sendMail } from "../../utils/emailUtil";
import bcrypt from "bcrypt";
import crypto, { randomUUID } from "crypto";
import { API_SERVER, PUBLIC_SERVER } from "../../constants";
import PassReset from "../../models/passwordReset";
import ejs from "ejs";
import path from "path";
import { GetPermissions } from "../../schemas/permission";

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

          const token = randomUUID();
          req.session["user"] = {
            id: user._id,
            email: user.email,
            tenant: user.tenantId,
          };

          const data = user.toObject();

          data.password = "secret";

          Object.assign(data, {
            customPermissions: await GetPermissions(
              user.userGroupId,
              user.userType,
              user.tenantId
            ),
            password: undefined,
          });
          if (user.userType == "tenant-client") {
            const date1 = new Date(user.expiryDatee);
            const date2 = new Date(Date.now());
            if (date2 > date1) {
              return res.status(401).json({
                status: false,
                message: "Client has expired",
              });
            } else {
              res.json({
                status: true,
                message: "login sucessfully",
                token,
                data,
              });
            }
          } else {
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
  const customPermissions = await GetPermissions(
    res.locals.user.userGroupId,
    res.locals.user.userType,
    res.locals.user.tenantId?._id
  );
  if (customPermissions.length == 0) {
    return res.status(404).json({
      status: false,
      message: "userGroup not found",
    });
  }
  Object.assign(res.locals.user, {
    customPermissions,
    password: undefined,
  });
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

    const html = await ejs.renderFile(
      path.join(__dirname, "..", "..", "views", "mails", "resetPassword.ejs"),
      {
        resetPasswordUrl: resetPasswordUrl,
      },
      { async: true }
    );

    await sendMail(
      email,
      "Password Reset Request || Kesowa Infinite Ventures Pvt. Ltd",
      "",
      html,
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

    await User.findOneAndUpdate(
      { email: pass.email },
      { $set: { password: hashedPassword } }
    );

    await pass.delete();
    req.session.destroy(err => {
      if (err) {
        req.log.error(err, "failed to delete session");
      }
      res.clearCookie("connect.sid");
    });
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
