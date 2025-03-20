import express from "express";
import cors from "cors";
import morgan from "morgan";
import { userRouter } from "./routes/user.routes";
import docsRouter from "./routes/docs.routes";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { healthCheck } from "./controller/health.controller";
import metricsRouter from "./routes/metrics.routes";
import { logger } from "./utils/logger";

dotenv.config();
const app = express();

app.use(morgan("dev"));
app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.use("/api/v1", userRouter);
// logger.error("Error message");

app.use("/api/v1", docsRouter);
app.use("/api/v1/healthCheck", healthCheck);
app.use("/", metricsRouter);

export default app;
