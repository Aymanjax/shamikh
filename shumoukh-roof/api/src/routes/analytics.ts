import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { adminOnly } from "../middleware/adminOnly";
import { collections } from "../services/firestore";
import type { AuthenticatedRequest } from "../types";

const router = Router();
router.use(authenticate);
router.use(adminOnly);

router.get("/dashboard", async (_req: AuthenticatedRequest, res, next) => {
  try {
    const [
      usersSnap,
      suppliersSnap,
      invoicesSnap,
      workersSnap,
      projectsSnap,
      announcementsSnap,
    ] = await Promise.all([
      collections.usersPublic.get(),
      collections.suppliers.get(),
      collections.invoices.get(),
      collections.workers.get(),
      collections.offers.get(),
      collections.announcements.get(),
    ]);

    const now = new Date();
    const activeOffers = suppliersSnap.docs.filter((d) => {
      const data = d.data();
      if (!data.active) return false;
      const end = data.endDate?.toDate?.();
      return end ? end > now : true;
    });

    const paidInvoices = invoicesSnap.docs.filter((d) => d.data().status === "paid");
    const totalRevenue = paidInvoices.reduce((sum, d) => sum + (d.data().amount || 0), 0);

    res.json({
      stats: {
        totalUsers: usersSnap.size,
        totalSuppliers: suppliersSnap.size,
        totalInvoices: invoicesSnap.size,
        totalWorkers: workersSnap.size,
        totalAnnouncements: announcementsSnap.size,
        activeOffers: activeOffers.length,
        paidInvoices: paidInvoices.length,
        totalRevenue,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get("/users-growth", async (_req: AuthenticatedRequest, res, next) => {
  try {
    const snap = await collections.usersPublic.get();
    const monthly: Record<string, number> = {};

    snap.docs.forEach((d) => {
      const data = d.data();
      const lastLogin = data.lastLogin?.toDate?.();
      if (lastLogin) {
        const key = `${lastLogin.getFullYear()}-${String(lastLogin.getMonth() + 1).padStart(2, "0")}`;
        monthly[key] = (monthly[key] || 0) + 1;
      }
    });

    res.json({ data: Object.entries(monthly).map(([month, count]) => ({ month, count })) });
  } catch (err) {
    next(err);
  }
});

export default router;
