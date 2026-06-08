import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { adminOnly } from "../middleware/adminOnly";
import { listAllUsers, updateUserRole, toggleUserBan, setSubscription } from "../services/adminService";
import { log } from "../services/auditService";
import type { AuthenticatedRequest } from "../types";

const router = Router();

router.use(authenticate);
router.use(adminOnly);

router.get("/", async (req: AuthenticatedRequest, res, next) => {
  try {
    const users = await listAllUsers();
    res.json({ data: users, total: users.length });
  } catch (err) {
    next(err);
  }
});

router.put("/:uid/role", async (req: AuthenticatedRequest, res, next) => {
  try {
    const { role } = req.body;
    await updateUserRole(req.params.uid, role);
    await log("update_role", req.user.uid, `Changed role to ${role}`, req.params.uid);
    res.json({ message: "تم تحديث الصلاحية" });
  } catch (err) {
    next(err);
  }
});

router.post("/:uid/ban", async (req: AuthenticatedRequest, res, next) => {
  try {
    await toggleUserBan(req.params.uid);
    await log("toggle_ban", req.user.uid, "Toggled ban status", req.params.uid);
    res.json({ message: "تم تحديث حالة الحظر" });
  } catch (err) {
    next(err);
  }
});

router.put("/:uid/subscription", async (req: AuthenticatedRequest, res, next) => {
  try {
    const { plan, days } = req.body;
    await setSubscription(req.params.uid, plan, days);
    await log("set_subscription", req.user.uid, `Set ${plan} for ${days} days`, req.params.uid);
    res.json({ message: "تم تحديث الاشتراك" });
  } catch (err) {
    next(err);
  }
});

export default router;
