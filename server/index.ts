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

  // CORS - restrict to known origins in production
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",")
    : undefined; // undefined = allow all in dev

  app.use(cors({
    origin: allowedOrigins ?? true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }));

  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));

  // Security headers
  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader(
      "Content-Security-Policy",
      [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "font-src 'self' data:",
        "connect-src 'self' https://*.supabase.co https://api.anthropic.com https://api.github.com",
        "frame-ancestors 'none'",
      ].join("; ")
    );
    next();
  });

  // Rate limiters
  const aiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    message: { error: "Too many AI requests. Please wait a moment." },
    standardHeaders: true,
    legacyHeaders: false,
    validate: false,
    keyGenerator: (req: express.Request): string => {
      const userId = req.body?.userId || req.query?.userId;
      if (userId && typeof userId === "string") return `user:${userId}`;
      return req.ip || "unknown";
    },
  });

  const generalLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    validate: false,
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
