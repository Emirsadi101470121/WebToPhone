import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { handleAnalyze, handleConvert } from "./routes/analyze";
import { handleExport } from "./routes/export";
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

  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);
  app.post("/api/analyze", handleAnalyze);
  app.post("/api/convert", handleConvert);

  app.post("/api/export", handleExport);

  app.get("/api/github/auth", handleGithubAuth);
  app.get("/api/github/callback", handleGithubCallback);
  app.get("/api/github/status", handleGithubStatus);
  app.get("/api/github/repos", handleGithubRepos);
  app.post("/api/github/disconnect", handleGithubDisconnect);

  return app;
}
