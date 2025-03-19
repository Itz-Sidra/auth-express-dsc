import { NextFunction, Request, Response } from "express";
// import { logger } from "../app";
import { logger } from "../utils/logger";

export const loggerMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.info({
    message: "Request received",
    method: req.method,
    path: req.path,
    userId: req.user?.id || "unauthenticated",
  });

  // Log response when finished
  res.on("finish", () => {
    logger.info({
      message: "Response sent",
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      userId: req.user?.id || "unauthenticated",
    });
  });

  next();
};
