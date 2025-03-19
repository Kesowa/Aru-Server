import nodemailer from "nodemailer";

import {
    Mode,
    MODE,
  SMTP_PASSWORD,
  SMTP_PORT,
  SMTP_SERVER,
  SMTP_USERNAME,
} from "../constants";
import { logger } from "../app";

//create transporter
const transporter = MODE == Mode.Prod ? nodemailer.createTransport({
  host: SMTP_SERVER,
  port: Number(SMTP_PORT) || 25,
  secure: false,
  auth: {
    user: SMTP_USERNAME,
    pass: SMTP_PASSWORD,
  },
}) : {
  sendMail: function(mail: any) {
    logger.info(mail, "Got mail!");
  }
};

export const sendMail = async (
  emailTo: string,
  subject: string,
  text: any,
  html: any,
  file: any,
) => {
  try {
    const defaultmailOption = {
      from: "no-reply@kesowa.com",
      to: emailTo,
      subject: subject,
      text: text,
      html: html,
    };
    let mailOption = {};
    if (file) {
      mailOption = {
        ...defaultmailOption,
        attachments: [
          {
            filename: "receipt",
            path: file,
          },
        ],
      };
    } else {
      mailOption = {
        ...defaultmailOption,
      };
    }
    const resp = await transporter.sendMail(mailOption);
    console.log(resp);
  } catch (err) {
    console.error(err);
  }
};
