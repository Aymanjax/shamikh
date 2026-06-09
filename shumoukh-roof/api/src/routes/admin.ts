import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { adminOnly } from "../middleware/adminOnly";
import * as adminService from "../services/adminService";
import * as themeService from "../services/themeService";
import type { TodayLogin } from "../services/adminService";
import { log } from "../services/auditService";
import { collections } from "../services/firestore";
import type { AuthenticatedRequest } from "../types";

const router = Router();
router.use(authenticate);
router.use(adminOnly);

// ── Program Config ──

router.get("/config", async (_req: AuthenticatedRequest, res, next) => {
  try {
    const config = await adminService.getConfig();
    res.json(config);
  } catch (err) {
    next(err);
  }
});

router.put("/config", async (req: AuthenticatedRequest, res, next) => {
  try {
    await adminService.saveConfig(req.body);
    await log("update_config", req.user.uid, "Updated program config");
    res.json({ message: "تم تحديث الإعدادات" });
  } catch (err) {
    next(err);
  }
});

// ── Theme & Branding ──

router.get("/theme", async (_req: AuthenticatedRequest, res, next) => {
  try {
    const theme = await themeService.getTheme();
    res.json(theme);
  } catch (err) {
    next(err);
  }
});

router.put("/theme", async (req: AuthenticatedRequest, res, next) => {
  try {
    await themeService.saveTheme(req.body);
    await log("update_theme", req.user.uid, "Updated theme & branding");
    res.json({ message: "تم تحديث المظهر" });
  } catch (err) {
    next(err);
  }
});

// ── Dashboard Stats ──

router.get("/stats", async (_req: AuthenticatedRequest, res, next) => {
  try {
    const stats = await adminService.getDashboardStats();
    res.json(stats);
  } catch (err) {
    next(err);
  }
});

// ── Comprehensive Stats ──

router.get("/full-stats", async (_req: AuthenticatedRequest, res, next) => {
  try {
    const [invoicesSnap, workersSnap, usersSnap] = await Promise.all([
      collections.invoices.orderBy("createdAt", "desc").get(),
      collections.workers.get(),
      collections.usersPublic.get(),
    ]);

    const invoices = invoicesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const workers = workersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    const totalRevenue = invoices.reduce((s: number, inv: any) => s + (inv.amount || 0), 0);
    const paidRevenue = invoices.filter((i: any) => i.status === "paid").reduce((s: number, inv: any) => s + (inv.amount || 0), 0);
    const pendingRevenue = invoices.filter((i: any) => i.status === "pending").reduce((s: number, inv: any) => s + (inv.amount || 0), 0);
    const draftCount = invoices.filter((i: any) => i.status === "draft").length;
    const pendingCount = invoices.filter((i: any) => i.status === "pending").length;
    const paidCount = invoices.filter((i: any) => i.status === "paid").length;

    res.json({
      users: usersSnap.size,
      workers: workers.length,
      invoices: invoices.length,
      totalRevenue,
      paidRevenue,
      pendingRevenue,
      byStatus: { draft: draftCount, pending: pendingCount, paid: paidCount },
    });
  } catch (err) {
    next(err);
  }
});

// ── Audit Logs ──

router.get("/audit-logs", async (req: AuthenticatedRequest, res, next) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const logs = await adminService.getAuditLogs(limit);
    res.json({ data: logs });
  } catch (err) {
    next(err);
  }
});

// ── Online Users ──

router.get("/online", async (_req: AuthenticatedRequest, res, next) => {
  try {
    const users = await adminService.getOnlineUsers();
    res.json({ data: users, total: users.length });
  } catch (err) {
    next(err);
  }
});

// ── Today's Logins ──

router.get("/today-logins", async (_req: AuthenticatedRequest, res, next) => {
  try {
    const logins = await adminService.getTodayLogins();
    res.json({ data: logins, total: logins.length });
  } catch (err) {
    next(err);
  }
});

export default router;
