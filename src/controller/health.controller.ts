import { Request, Response } from "express";
import { getPrismaClient } from "../db/prisma";
import { RedisSingleton } from "../db/redis.cache";

export const healthCheck = async (req: Request, res: Response): Promise<void> => {
  try {
    const prisma = getPrismaClient();
    await prisma.$queryRaw`SELECT 1`;

    const redis = RedisSingleton.getInstance();
    const redisPing = await redis.ping();
    if (redisPing !== "PONG") {
      throw new Error("Redis not connected");
    }

    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "authBackend",
      version: "1.0.0",
      checks: {
        database: "connected",
        cache: "connected",
      },
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Service unhealthy";
    res.status(503).json({
      status: "error",
      message: errorMessage,
      timestamp: new Date().toISOString(),
    });
  }
};