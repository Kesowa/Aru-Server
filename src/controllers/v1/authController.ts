import { Request } from "express";
import { AuthResponse } from "../../utils/interfaceUtils";
import User from "../../models/user";
import { generateResetPasswordToken } from "../../utils/resetPasswordUtils";
import { sendMail } from "../../utils/emailUtil";
import bcrypt from "bcrypt";
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
                data,
              });
            }
          } else {
            res.json({
              status: true,
              message: "login sucessfully",
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

//++++++++++++++++++++++++++++++++ log out user +++++++++++++++++++++++++++++++++++++++++
export const logoutUser = async (req: Request, res: AuthResponse) => {
  if (req.session) {
    req.session.destroy((err) => {
      if (err) req.log.error(err, "unable to destroy session!");
    });
    res.clearCookie("connect.sid");
    return res.json({
      status: true,
      message: "user session deleted",
    });
  }
  res.json({
    status: false,
    message: "no session to delete",
  });
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
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/html");
  res.render("pages/resetPassword", {
    token: req.params.token,
    message: "",
  });
};

// send mail to reset password
export const sendForgotPasswordMail = async (
  req: Request,
  res: AuthResponse
) => {
  const email = req.body.email;
  const user = await User.findOne({ email: email }).lean();

  if (!user) {
    return res.status(201).json({
      status: false,
      message: "Email is not registered",
    });
  }

  const token = await generateResetPasswordToken(email);

  const resetPasswordUrl = `${API_SERVER}/apis/v1/auth/reset-password/${encodeURIComponent(
    token
  )}`;

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

    const body = decodeURIComponent(token).split(";", 2);
    const pass = await PassReset.findOne({ email: body[0] });
    const isToken = await bcrypt.compare(body[1], pass.passwordResetToken);

    if (!isToken) {
      res.render("pages/resetPassword", {
        token: token,
        message: "Invalid Token",
      });
      return;
    }

    await User.findOneAndUpdate(
      { email: pass.email },
      { $set: { password: await bcrypt.hash(password, 10) } }
    );

    await pass.delete();
    req.session.destroy((err) => {
      if (err) {
        req.log.error(err, "failed to delete session");
      }
      res.clearCookie("connect.sid");
    });
    res.redirect(PUBLIC_SERVER);
  }
};
