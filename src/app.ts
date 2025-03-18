import express from "express";
import cors from "cors";
import morgan from "morgan";
import {userRouter} from "./routes/user.routes";
import healthCheckRouter from "./routes/healthCheck.routes";
import docsRouter from "./routes/docs.routes";
import dotenv from "dotenv";
import cookieParser from "cookie-parser"

dotenv.config();
const app = express();


app.use(morgan("dev")); 
app.use(cors()); 
app.use(express.json()); 
app.use(cookieParser())

app.use("/api/v1", userRouter);
app.use("/api/v1", docsRouter);
app.use("/api/v1/healthCheck", healthCheckRouter);

export default app;
