import express from "express";
import { healthController } from "./controller/health.controller";

const app = express();

app.get("/api/v1/health", healthController);

export default app;
