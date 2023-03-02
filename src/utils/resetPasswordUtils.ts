import crypto from "crypto";
import PassReset from "../models/passwordReset";

export async function generateResetPasswordToken(email) {
  const token = crypto.randomBytes(50).toString("hex");

  const hash = crypto.pbkdf2Sync(token, "", 1000, 64, "sha512").toString("hex");

  try {
    await PassReset.updateOne(
      { email: email },
      { passwordResetToken: hash, $inc: { retries: 1 } },
      { upsert: true }
    );

    return token;
  } catch (error) {
    console.error(error);
  }
}

// , tokenExpiry: Date.now() + 3600000
