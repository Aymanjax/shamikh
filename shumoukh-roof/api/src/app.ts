import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";
import authRoutes from "./routes/auth";
import userRoutes from "./routes/users";
import projectRoutes from "./routes/projects";
import supplierRoutes from "./routes/suppliers";
import invoiceRoutes from "./routes/invoices";
import workerRoutes from "./routes/workers";
import announcementRoutes from "./routes/announcements";
import adminRoutes from "./routes/admin";
import calculatorRoutes from "./routes/calculator";
import roofRoutes from "./routes/roof";
import analyticsRoutes from "./routes/analytics";
import themeRoutes from "./routes/theme";

const app = express();

// ── Security & Parsing ──
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(express.json({ limit: "5mb" }));
app.use(morgan(env.isDev ? "dev" : "combined"));

// ── Health Check ──
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── API v1 Routes ──
const v1 = express.Router();

v1.use("/auth", authRoutes);
v1.use("/users", userRoutes);
v1.use("/projects", projectRoutes);
v1.use("/suppliers", supplierRoutes);
v1.use("/invoices", invoiceRoutes);
v1.use("/workers", workerRoutes);
v1.use("/announcements", announcementRoutes);
v1.use("/admin", adminRoutes);
v1.use("/calculator", calculatorRoutes);
v1.use("/roof", roofRoutes);
v1.use("/analytics", analyticsRoutes);
v1.use("/theme", themeRoutes); // public read (theme applies before login)

app.use("/api/v1", v1);

// ── 404 ──
app.use((_req, res) => {
  res.status(404).json({ error: "المسار غير موجود" });
});

// ── Error Handler ──
app.use(errorHandler);

export default app;
