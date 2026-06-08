import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { getConfig } from "../services/adminService";
import type { AuthenticatedRequest } from "../types";

const router = Router();
router.use(authenticate);

router.get("/config", async (_req: AuthenticatedRequest, res, next) => {
  try {
    const config = await getConfig();
    res.json({
      tileCatalog: config.tileCatalog,
      marketLengths: config.marketLengths,
      orderItems: config.orderItems,
      extraItems: config.extraItems,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/materials", async (_req: AuthenticatedRequest, res, next) => {
  try {
    const config = await getConfig();
    res.json({ data: config.tileCatalog });
  } catch (err) {
    next(err);
  }
});

router.get("/market-lengths", async (_req: AuthenticatedRequest, res, next) => {
  try {
    const config = await getConfig();
    res.json({ data: config.marketLengths });
  } catch (err) {
    next(err);
  }
});

router.get("/order-items", async (_req: AuthenticatedRequest, res, next) => {
  try {
    const config = await getConfig();
    res.json({ data: config.orderItems });
  } catch (err) {
    next(err);
  }
});

router.get("/extra-items", async (_req: AuthenticatedRequest, res, next) => {
  try {
    const config = await getConfig();
    res.json({ data: config.extraItems });
  } catch (err) {
    next(err);
  }
});

export default router;
