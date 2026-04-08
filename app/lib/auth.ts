import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

export type AuthPayload = { userId: string; phone: string; role: string };

export const hashPassword = (v: string) => bcrypt.hash(v, 12);
export const verifyPassword = (raw: string, hash: string) => bcrypt.compare(raw, hash);
export const signToken = (payload: AuthPayload) => jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
export const verifyToken = (token: string) => {
  try { return jwt.verify(token, JWT_SECRET) as AuthPayload; } catch { return null; }
};

export const getUserFromRequest = (req: NextRequest) => {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;
  return verifyToken(token);
};

export const requireAdmin = (req: NextRequest) => {
  const user = getUserFromRequest(req);
  return user && user.role === "admin" ? user : null;
};
