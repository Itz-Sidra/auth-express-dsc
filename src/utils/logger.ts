import winston, { createLogger } from "winston";
import LokiTransport from "winston-loki";

export const logger = winston.createLogger({
  level: "info", // This sets the minimum log level
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    new LokiTransport({
      host: "http://loki:3100",
      labels: { job: "auth-backend" },
      json: true,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      onConnectionError: (err) => console.error("Loki connection error:", err),
    }),
  ],
});
