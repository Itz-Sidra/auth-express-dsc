import express from "express";
import cors from "cors";
import morgan from "morgan";
import {userRouter} from "./routes/user.routes";
import healthCheckRouter from "./routes/healthCheck.routes";
import docsRouter from "./routes/docs.routes";
import dotenv from "dotenv";

dotenv.config();
const app = express();


// Middleware
app.use(morgan("dev")); // Logger (similar to Hono's logger)
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON body

// Routes
app.use("/api/v1", userRouter);
app.use("/api/v1", docsRouter);
app.use("/api/v1/healthCheck", healthCheckRouter);

export default app;
