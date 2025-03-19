import express from "express";
import {
  getMetrics,
  metricsMiddleware,
} from "../controller/metrics.controller";

const router = express.Router();

router.get("/metrics", metricsMiddleware, getMetrics);

export default router;
