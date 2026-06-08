import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/auth";
import { adminOnly } from "../middleware/adminOnly";
import { validate } from "../middleware/validate";
import * as workerService from "../services/workerService";
import type { AuthenticatedRequest } from "../types";

const router = Router();
router.use(authenticate);

const createSchema = z.object({
  name: z.string().min(1, "اسم العامل مطلوب"),
  role: z.string().min(1),
  phone: z.string().optional(),
  project: z.string().optional(),
  wage: z.number().positive("الأجر يجب أن يكون أكبر من صفر"),
  days: z.number().int().positive(),
});

const updateSchema = z.object({
  name: z.string().optional(),
  role: z.string().optional(),
  phone: z.string().optional(),
  project: z.string().optional(),
  wage: z.number().positive().optional(),
  days: z.number().int().positive().optional(),
});

router.post("/", validate(createSchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    const id = await workerService.createWorker(req.user.uid, req.body);
    res.status(201).json({ id, message: "تم إضافة العامل" });
  } catch (err) {
    next(err);
  }
});

router.get("/", async (req: AuthenticatedRequest, res, next) => {
  try {
    const workers = req.user.role === "admin"
      ? await workerService.listAllWorkers()
      : await workerService.listWorkers(req.user.uid);
    res.json({ data: workers, total: workers.length });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req: AuthenticatedRequest, res, next) => {
  try {
    const worker = await workerService.getWorker(req.params.id);
    if (!worker) {
      res.status(404).json({ error: "العامل غير موجود" });
      return;
    }
    if (worker.userId !== req.user.uid && req.user.role !== "admin") {
      res.status(403).json({ error: "غير مصرح" });
      return;
    }
    res.json(worker);
  } catch (err) {
    next(err);
  }
});

router.put("/:id", validate(updateSchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    const worker = await workerService.getWorker(req.params.id);
    if (!worker) {
      res.status(404).json({ error: "العامل غير موجود" });
      return;
    }
    if (worker.userId !== req.user.uid && req.user.role !== "admin") {
      res.status(403).json({ error: "غير مصرح" });
      return;
    }
    await workerService.updateWorker(req.params.id, req.body);
    res.json({ message: "تم تحديث بيانات العامل" });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req: AuthenticatedRequest, res, next) => {
  try {
    const worker = await workerService.getWorker(req.params.id);
    if (!worker) {
      res.status(404).json({ error: "العامل غير موجود" });
      return;
    }
    if (worker.userId !== req.user.uid && req.user.role !== "admin") {
      res.status(403).json({ error: "غير مصرح" });
      return;
    }
    await workerService.deleteWorker(req.params.id);
    res.json({ message: "تم حذف العامل" });
  } catch (err) {
    next(err);
  }
});

export default router;
