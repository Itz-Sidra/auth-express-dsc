import Redis from "ioredis";
import { MapData } from "../utils/types";

export class RedisSingleton {
  private static instance: Redis | null = null;
  private static DEFAULT_TTL = 3600;
  private static RATE_LIMIT_TTL = 600;

  private constructor() {}

  static getInstance(): Redis {
    if (!this.instance) {
      const redisUrl = process.env.REDIS_URL;

      if (!redisUrl) {
        throw new Error("Missing Redis environment variable: REDIS_URL");
      }

      // Correct Redis connection
      this.instance = new Redis(redisUrl);
    }
    return this.instance;
  }

  static getTtl(): number {
    return this.DEFAULT_TTL;
  }

  static getRateLimitTtl(): number {
    return this.RATE_LIMIT_TTL;
  }

  static async set(key: string, value: MapData | number, ttl?: number): Promise<void> {
    const redis = this.getInstance();
    const serializedValue = typeof value === "number" ? value.toString() : JSON.stringify(value);
    await redis.set(key, serializedValue, "EX", ttl ?? this.DEFAULT_TTL);
}
}
