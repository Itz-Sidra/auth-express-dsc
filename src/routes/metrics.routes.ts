import express from "express";
import { getMetrics } from "../controller/metrics.controller";

const router = express.Router();

router.get("/metrics", getMetrics);

export default router;
