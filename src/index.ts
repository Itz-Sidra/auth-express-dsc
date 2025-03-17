import express from "express";
import app from "./app";

const server = express();

server.use(express.json())

server.use(app)

server.listen(4000, () => console.log("Server running!"))