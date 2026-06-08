import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/auth";
import { adminOnly } from "../middleware/adminOnly";
import { validate } from "../middleware/validate";
import * as announcementService from "../services/announcementService";
import type { AuthenticatedRequest } from "../types";

const router = Router();

const createSchema = z.object({
  title: z.string().min(1, "العنوان مطلوب"),
  content: z.string().min(1, "المحتوى مطلوب"),
  type: z.enum(["info", "warning", "update", "maintenance"]),
  priority: z.enum(["low", "normal", "high"]),
  published: z.boolean().optional(),
});

const updateSchema = z.object({
  title: z.string().optional(),
  content: z.string().optional(),
  type: z.enum(["info", "warning", "update", "maintenance"]).optional(),
  priority: z.enum(["low", "normal", "high"]).optional(),
  published: z.boolean().optional(),
});

// Public: list published announcements
router.get("/published", authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const announcements = await announcementService.listAnnouncements(true);
    res.json({ data: announcements, total: announcements.length });
  } catch (err) {
    next(err);
  }
});

// User notifications
router.get("/notifications", authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const notifications = await announcementService.getUserNotifications(req.user.uid);
    res.json({ data: notifications });
  } catch (err) {
    next(err);
  }
});

router.post("/notifications/:announcementId/read", authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    await announcementService.markAsRead(req.user.uid, req.params.announcementId);
    res.json({ message: "تم التحديث" });
  } catch (err) {
    next(err);
  }
});

router.post("/notifications/:announcementId/unread", authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    await announcementService.markAsUnread(req.user.uid, req.params.announcementId);
    res.json({ message: "تم التحديث" });
  } catch (err) {
    next(err);
  }
});

// Admin CRUD
router.use(authenticate);
router.use(adminOnly);

router.get("/", async (req: AuthenticatedRequest, res, next) => {
  try {
    const announcements = await announcementService.listAnnouncements();
    res.json({ data: announcements, total: announcements.length });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req: AuthenticatedRequest, res, next) => {
  try {
    const announcement = await announcementService.getAnnouncement(req.params.id);
    if (!announcement) {
      res.status(404).json({ error: "الإعلان غير موجود" });
      return;
    }
    res.json(announcement);
  } catch (err) {
    next(err);
  }
});

router.post("/", validate(createSchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    const id = await announcementService.createAnnouncement({
      ...req.body,
      createdBy: req.user.uid,
      createdByDisplay: req.user.displayName,
      published: req.body.published ?? false,
    });
    res.status(201).json({ id, message: "تم إنشاء الإعلان" });
  } catch (err) {
    next(err);
  }
});

router.put("/:id", validate(updateSchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    await announcementService.updateAnnouncement(req.params.id, req.body);
    res.json({ message: "تم تحديث الإعلان" });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req: AuthenticatedRequest, res, next) => {
  try {
    await announcementService.deleteAnnouncement(req.params.id);
    res.json({ message: "تم حذف الإعلان" });
  } catch (err) {
    next(err);
  }
});

export default router;
