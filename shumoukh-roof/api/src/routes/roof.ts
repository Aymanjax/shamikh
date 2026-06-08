import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { env } from "../config/env";
import type { AuthenticatedRequest } from "../types";

const router = Router();
router.use(authenticate);

const skeletonSchema = z.object({
  vertices: z.array(z.object({ x: z.number(), y: z.number() })).min(3, "يجب إرسال 3 نقاط على الأقل"),
  sides: z.array(z.object({ isActive: z.boolean(), length: z.number() })),
  slopePercent: z.number().optional(),
  height: z.number().optional(),
  tan: z.number().optional(),
});

router.post("/skeletonize", validate(skeletonSchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!env.roofSkeletonApiUrl) {
      res.status(503).json({ error: "خدمة حساب هيكل السقف غير متوفرة حالياً" });
      return;
    }

    const response = await fetch(env.roofSkeletonApiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      res.status(response.status).json({ error: error.error || "فشل حساب هيكل السقف" });
      return;
    }

    const data = await response.json();
    res.json(data);
  } catch (err: any) {
    if (err.name === "TimeoutError" || err.name === "AbortError") {
      res.status(504).json({ error: "انتهت مهلة الطلب. الرجاء المحاولة مرة أخرى." });
      return;
    }
    next(err);
  }
});

export default router;
