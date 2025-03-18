import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

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
    const header = req.header("Authorization");
    if (!header) {
      return res.status(401).json({ message: "No authorization header", success: false });
    }

    const token = header.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Token missing", success: false });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: "Missing secret key", success: false });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;
    if (!decoded) {
      return res.status(403).json({ message: "Invalid or malformed JWT!", success: false });
    }

    req.user = decoded;

    next();
  } catch (error) {
    console.error("Auth error:", error);
    return res.status(403).json({
      message: error instanceof Error ? error.message : "Unauthorized",
      success: false,
    });
  }
};