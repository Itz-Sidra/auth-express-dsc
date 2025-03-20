import { Request, Response, NextFunction } from "express";
import { RedisSingleton } from "../db/redis.cache";
import { RateLimitCache } from "../db/ratelimit.memory";
import {
  cacheHitRatio,
  cacheHits,
  cacheMisses,
  rateLimiterBlocks,
} from "../controller/metrics.controller";
import client from "prom-client";

export const rateLimiter = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const LIMIT = 10;
  const WINDOW = 60;

  try {
    const redisClient = RedisSingleton.getInstance();

    const ip =
      req.ip || req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    const path = req.route?.path || req.path;

    if (!ip) {
      res.status(429).json({ message: "IP address not found", success: false });
      return;
    }

    const cacheKey = `ip:${ip}:${path}`;

    let reqs = RateLimitCache.getIp(cacheKey);
    if (reqs >= LIMIT) {
      rateLimiterBlocks.inc({
        ip: String(ip),
        route: path,
      });
      res.status(429).json({ message: "RATE-LIMIT", success: false });
      return;
    }

    RateLimitCache.incrementIp(cacheKey, WINDOW);

    let reqs_redis_str = await redisClient.get(cacheKey);
    let reqs_redis = reqs_redis_str ? Number(reqs_redis_str) : 0;

    if (reqs_redis >= LIMIT) {
      rateLimiterBlocks.inc({
        ip: String(ip),
        route: path,
      });
      res.status(429).json({ message: "RATE-LIMIT", success: false });
      return;
    }
    if (reqs_redis_str) {
      cacheHits.inc({
        ip: String(ip),
        route: path,
      });
    } else {
      cacheMisses.inc({
        ip: String(ip),
        route: path,
      });
    }

    const hitsString = await client.register.getSingleMetricAsString(
      "cache_hits_total"
    );
    const missesString = await client.register.getSingleMetricAsString(
      "cache_misses_total"
    );
    const hits = parseFloat(hitsString);
    const misses = parseFloat(missesString);
    const totalCacheAttempts = hits + misses;

    if (totalCacheAttempts > 0) {
      cacheHitRatio.set(hits / totalCacheAttempts);
    }

    await redisClient.set(cacheKey, (reqs_redis + 1).toString(), "EX", WINDOW);

    next();
  } catch (error) {
    res.status(429).json({
      message: error instanceof Error ? error.message : error,
      success: false,
    });
  }
};
