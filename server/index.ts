import "dotenv/config";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { handleDemo } from "./routes/demo";
import { handleAnalyze, handleReimagine, handleConvert } from "./routes/analyze";
import { handleExport } from "./routes/export";
import {
  handleGetNotificationSettings,
  handleUpdateNotificationSettings,
} from "./routes/notifications";
import {
  handleGithubAuth,
  handleGithubCallback,
  handleGithubStatus,
  handleGithubRepos,
  handleGithubDisconnect,
} from "./routes/github";

export function createServer() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true }));

  // Rate limiters
  const aiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    message: { error: "Too many AI requests. Please wait a moment." },
    standardHeaders: true,
    legacyHeaders: false,
  });

  const generalLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use("/api/", generalLimiter);

  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);
  app.post("/api/analyze", aiLimiter, handleAnalyze);
  app.post("/api/reimagine", aiLimiter, handleReimagine);
  app.post("/api/convert", aiLimiter, handleConvert);

  app.post("/api/export", handleExport);

  app.get("/api/github/auth", handleGithubAuth);
  app.get("/api/github/callback", handleGithubCallback);
  app.get("/api/github/status", handleGithubStatus);
  app.get("/api/github/repos", handleGithubRepos);
  app.post("/api/github/disconnect", handleGithubDisconnect);

  app.get("/api/notifications/settings", handleGetNotificationSettings);
  app.post("/api/notifications/settings", handleUpdateNotificationSettings);

  return app;
}
