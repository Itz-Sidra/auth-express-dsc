import jwt from "jsonwebtoken";
import { signData } from "./types";

export const generateToken = (data: signData) => {
  const accessSecret = process.env.JWT_SECRET;
  const refreshSecret = process.env.REFRESH_SECRET; // Ensure this is set in your .env

  if (!accessSecret || !refreshSecret) {
    throw new Error("Missing JWT secrets in environment variables!");
  }

  const accessData = { ...data, exp: Math.floor(Date.now() / 1000) + 60 * 60 }; // 1 hour
  const refreshData = { ...data, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 }; // 7 days

  const accessToken = jwt.sign(accessData, accessSecret);
  const refreshToken = jwt.sign(refreshData, refreshSecret);

  return { accessToken, refreshToken };
};
