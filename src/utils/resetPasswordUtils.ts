import crypto from "crypto";
import PassReset from "../models/passwordReset";
import bcrypt from "bcrypt";

export async function generateResetPasswordToken(email: string) {
  const token = crypto.randomBytes(50).toString("base64url");
  const hash = await bcrypt.hash(token, 10);

  await PassReset.updateOne(
    { email: email },
    { passwordResetToken: hash, $inc: { retries: 1 } },
    { upsert: true }
  );

  return email + ";" + token;
}
