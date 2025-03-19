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

// Counter to track total requests
const totalRequests = new client.Counter({
  name: "http_req_total",
  help: "Total number of requests",
  labelNames: ["method", "route"],
});

// Middleware to track metrics
export const metricsMiddleware = (
  req: Request,
  res: Response,
  next: Function
) => {
  if (req.path === "/metrics") {
    return next();
  }

  const route = req.route ? req.route.path : req.path;
  const start = Date.now();
  totalRequests.inc({ method: req.method, route });

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

export const getMetrics = async (req: Request, res: Response) => {
  res.setHeader("Content-Type", client.register.contentType);
  const metrics = await client.register.metrics();
  res.send(metrics);
};
