import { inviteModel } from "../../models/invite";
import Mission from "../../models/mission";
import User from "../../models/user";
import { sendMail } from "../../utils/emailUtil";
import { AuthResponse } from "../../utils/interfaceUtils";
import { Request } from "express";
import { generateResetPasswordToken } from "../../utils/resetPasswordUtils";
import mongoose from "mongoose";
import { API_SERVER } from "../../constants";

export const inviteClient = async (req: Request, res: AuthResponse) => {
  const missionID = req.body.missionID;
  const emailID = req.body.emailID;
  if (!missionID) {
    return res.status(400).json({
      status: false,
      message: "no missionID supplied",
    });
  }
  if (!emailID) {
    return res.status(400).json({
      status: false,
      message: "no emailID supplied",
    });
  }

  const missionExists = await Mission.findOne(
    {
      _id: missionID,
    },
    {
      tenantId: 1,
    }
  );
  if (!missionExists) {
    return res.status(404).json({
      status: false,
      message: "mission does not exists",
    });
  }

  const invite = await inviteModel.create({
    email: emailID,
    missionID: missionID,
    creator: res.locals.user._id,
    valid: true,
    tenantId: missionExists.tenantId,
  });

  if (!invite) {
    return res.status(500).json({
      status: false,
      message: "failed to create invite",
    });
  }
  const inviteLink = `${API_SERVER}/apis/v1/client/register/${invite._id}`;

  await sendMail(
    emailID,
    "Invite Request || Kesowa Infinite Ventures Pvt. Ltd",
    "",
    `<p><b>Hi user!</b></p>
        <p>You have been invited to join a mission by ${res.locals.user.email}.</p>
        <p>In order to accept the invite, please <a href=${inviteLink}>click here!</a>
        <br/>
        <p><b>Please do not share this email or the password reset link, as it can compromise your account access and organization data!</b></p>
        <br/>
        <p>Best regards,</p>
        <p><b>Team Kesowa</b></p>
        `,
    ""
  );
  return res.json({
    status: true,
    message: `invite sent to ${emailID}`,
    data: {
      inviteID: invite._id,
    },
  });
};

export const registerClient = async (req: Request, res: AuthResponse) => {
  const inviteID = req.params.token;
  if (!inviteID || !mongoose.isValidObjectId(inviteID)) {
    return res.status(400).render("/pages/invalid_token");
  }
  const invite = await inviteModel.findById(inviteID, {
    email: 1,
    valid: 1,
    creator: 1,
    missionID: 1,
  });
  if (!invite || !invite.valid) {
    return res.status(404).render("/pages/invalid_token");
  }

  const user = await User.create({
    name: invite.email.split("@")[0],
    phoneNo: "0000000000",
    email: invite.email,
    createdBy: invite.creator,
    userType: "tenant-client",
    isTermsAccepted: true,
  });

  if (!user) {
    return res.status(500).render("/pages/invite_expired");
  }

  const updateMission = await Mission.updateOne(
    { _id: invite.missionID },
    {
      $addToSet: {
        clientId: user._id,
      },
    }
  );

  if (!updateMission.acknowledged) {
    return res.status(500).render("/pages/invite_expired");
  }

  const passwordResetToken = await generateResetPasswordToken(user.email);
  const passwordRedirect = `${API_SERVER}/apis/v1/auth/reset-password/${passwordResetToken}`;
  await sendMail(
    user.email,
    "Password Reset Request || Kesowa Infinite Ventures Pvt. Ltd",
    "",
    `<p><b>Hi user!</b></p>
        <p>We have recieved a request to change password for your account here at ARU.</p>
        <p>In order to reset your password, please <a href=${passwordRedirect}>click here!</a>
        <p><b>If this wasn't you, please report at admin@kesowa.com</b></p>
        <br/>
        <p><b>Please do not share this email or the password reset link, as it can compromise your account access and organization data!</b></p>
        <br/>
        <p>Best regards,</p>
        <p><b>Team Kesowa</b></p>
        `,
    ""
  );
  await invite.update({ valid: false });
  return res.redirect(passwordRedirect);
};
