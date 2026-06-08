import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/auth";
import { adminOnly } from "../middleware/adminOnly";
import { validate } from "../middleware/validate";
import * as projectService from "../services/projectService";
import type { AuthenticatedRequest } from "../types";

const router = Router();
router.use(authenticate);

const createSchema = z.object({
  client: z.object({ name: z.string(), phone: z.string().optional(), address: z.string().optional() }).optional(),
  calculatorData: z.record(z.unknown()).optional(),
});

const updateSchema = z.object({
  status: z.enum(["draft", "sent", "approved", "in_progress", "completed"]).optional(),
  client: z.object({ name: z.string(), phone: z.string().optional(), address: z.string().optional() }).optional(),
  order: z.array(z.object({ id: z.string(), name: z.string(), unit: z.string(), quantity: z.number(), received: z.number() })).optional(),
  calculatorData: z.record(z.unknown()).optional(),
});

const paymentSchema = z.object({
  amount: z.number().positive(),
  method: z.string().optional(),
});

router.post("/", validate(createSchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    const id = await projectService.createProject(req.user.uid, req.body);
    res.status(201).json({ id, message: "تم إنشاء المشروع" });
  } catch (err) {
    next(err);
  }
});

router.get("/", async (req: AuthenticatedRequest, res, next) => {
  try {
    if (req.user.role === "admin") {
      const projects = await projectService.listAllProjects();
      res.json({ data: projects, total: projects.length });
    } else {
      const projects = await projectService.listProjects(req.user.uid);
      res.json({ data: projects, total: projects.length });
    }
  } catch (err) {
    next(err);
  }
});

router.get("/:projectId", async (req: AuthenticatedRequest, res, next) => {
  try {
    const project = await projectService.getProject(req.user.uid, req.params.projectId);
    if (!project) {
      res.status(404).json({ error: "المشروع غير موجود" });
      return;
    }
    res.json(project);
  } catch (err) {
    next(err);
  }
});

router.put("/:projectId", validate(updateSchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    await projectService.updateProject(req.user.uid, req.params.projectId, req.body);
    res.json({ message: "تم تحديث المشروع" });
  } catch (err) {
    next(err);
  }
});

router.delete("/:projectId", async (req: AuthenticatedRequest, res, next) => {
  try {
    if (req.user.role === "admin") {
      const userId = (req.query.userId as string) || req.user.uid;
      await projectService.deleteProject(userId, req.params.projectId);
    } else {
      await projectService.deleteProject(req.user.uid, req.params.projectId);
    }
    res.json({ message: "تم حذف المشروع" });
  } catch (err) {
    next(err);
  }
});

router.post("/:projectId/payments", validate(paymentSchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    await projectService.addPayment(req.user.uid, req.params.projectId, req.body);
    res.json({ message: "تم إضافة الدفعة" });
  } catch (err) {
    next(err);
  }
});

router.delete("/:projectId/payments/:paymentId", async (req: AuthenticatedRequest, res, next) => {
  try {
    await projectService.deletePayment(req.user.uid, req.params.projectId, req.params.paymentId);
    res.json({ message: "تم حذف الدفعة" });
  } catch (err) {
    next(err);
  }
});

export default router;
