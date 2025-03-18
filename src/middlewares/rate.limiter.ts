import { Request, Response, NextFunction } from 'express';
import { RedisSingleton } from '../db/redis.cache';
import { RateLimitCache } from '../db/ratelimit.memory';

export const rateLimiter = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const LIMIT = 10;
  const WINDOW = 60; 

  try {
    const redisClient = RedisSingleton.getInstance();
    
    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const path = req.route?.path || req.path;

    if (!ip) {
      res.status(429).json({ message: "IP address not found", success: false });
      return;
    }

    const cacheKey = `ip:${ip}:${path}`;

    // Memory cache check (fallback)
    let reqs = RateLimitCache.getIp(cacheKey);
    if (reqs >= LIMIT) {
      res.status(429).json({ message: "RATE-LIMIT", success: false });
      return;
    }
    
    RateLimitCache.incrementIp(cacheKey, WINDOW);

    // Fetch requests count from Redis
    let reqs_redis_str = await redisClient.get(cacheKey);
    let reqs_redis = reqs_redis_str ? Number(reqs_redis_str) : 0;

    if (reqs_redis >= LIMIT) {
      res.status(429).json({ message: "RATE-LIMIT", success: false });
      return;
    }

    // Store updated count in Redis
    await redisClient.set(cacheKey, (reqs_redis + 1).toString(), "EX", WINDOW);

    next();
  } catch (error) {
    res.status(429).json({ message: error instanceof Error ? error.message : error, success: false });
  }
};
