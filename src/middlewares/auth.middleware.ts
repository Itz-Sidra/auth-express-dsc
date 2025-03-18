import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { getPrismaClient } from "../db/prisma";

interface JwtPayload {
  id: string;
  email: string;
  exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.access;
    const prisma = getPrismaClient()

    if (!token) {
      return res.status(401).json({ message: "No authorization header", success: false });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: "Missing secret key", success: false });
    }

    const revoked = await prisma.blacklist.findFirst({
      where: { token },
    });

    if (revoked) throw new Error("Token is revoked!");

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;
    if (!decoded) {
      return res.status(403).json({ message: "Invalid or malformed JWT!", success: false });
    }

    req.user = decoded;

    next();
  } catch (error) {

    return res.status(403).json({
      message: error instanceof Error ? error.message : "Unauthorized",
      success: false,
    });
  }
};