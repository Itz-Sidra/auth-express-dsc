import { Request, Response } from "express";
import client from "prom-client";

const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ register: client.register });

const reqResTime = new client.Histogram({
  name: "http_res_req_time",
  help: "Request response time in ms",
  labelNames: ["method", "route", "status_code"],
  buckets: [1, 50, 100, 200, 400, 500, 800, 1000, 2000],
});

const totalRequests = new client.Counter({
  name: "http_req_total_count",
  help: "Total number of requests",
  labelNames: ["method", "route"],
});

client.register.registerMetric(reqResTime);
client.register.registerMetric(totalRequests);

export const metricsMiddleware = (
  req: Request,
  res: Response,
  next: Function
) => {
  //if stops working
  if (req.path === "/metrics") {
    return next();
  }

  const route = req.route ? req.route.path : req.path;
  const start = Date.now();
  totalRequests.inc({ method: req.method, route });
  // totalRequests.inc();
  res.on("finish", () => {
    const duration = Date.now() - start;
    reqResTime
      .labels({
        method: req.method,
        route: route,
        status_code: res.statusCode,
      })
      .observe(duration);
  });

  next();
};

// Rate limiter block counter
export const rateLimiterBlocks = new client.Counter({
  name: "rate_limiter_blocks",
  help: "Number of requests blocked by rate limiter",
  labelNames: ["ip", "route"],
});

// Cache hits counter
export const cacheHits = new client.Counter({
  name: "cache_hits_total",
  help: "Total number of cache hits",
  labelNames: ["ip", "route"],
});

// Cache misses counter
export const cacheMisses = new client.Counter({
  name: "cache_misses_total",
  help: "Total number of cache misses",
  labelNames: ["ip", "route"],
});

export const cacheHitRatio = new client.Gauge({
  name: "cache_hit_ratio",
  help: "Cache hit ratio (hits / total requests)",
});

export const getMetrics = async (req: Request, res: Response) => {
  res.setHeader("Content-Type", client.register.contentType);
  const metrics = await client.register.metrics();
  res.send(metrics);
};
