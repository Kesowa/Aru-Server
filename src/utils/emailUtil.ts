import nodemailer from "nodemailer";

import {
  SMTP_PASSWORD,
  SMTP_PORT,
  SMTP_SERVER,
  SMTP_USERNAME,
} from "../constants";

//create transporter
const transporter = nodemailer.createTransport({
  host: SMTP_SERVER,
  port: Number(SMTP_PORT) || 25,
  secure: false,
  auth: {
    user: SMTP_USERNAME,
    pass: SMTP_PASSWORD,
  },
});

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
