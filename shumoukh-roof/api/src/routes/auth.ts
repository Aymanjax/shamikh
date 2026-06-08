import { Router } from "express";
import { z } from "zod";
import { auth, db } from "../config/firebase";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import type { AuthenticatedRequest } from "../types";

const router = Router();

const registerSchema = z.object({
  email: z.string().email("البريد الإلكتروني غير صالح"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
  displayName: z.string().min(1, "الاسم مطلوب"),
  companyName: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post("/register", validate(registerSchema), async (req, res, next) => {
  try {
    const { email, password, displayName, companyName } = req.body;
    const userRecord = await auth.createUser({ email, password, displayName });

    await db.doc(`users/${userRecord.uid}/profile/main`).set({
      displayName,
      email,
      role: "user",
      companyName: companyName || "",
      createdAt: new Date().toISOString(),
    });

    await db.doc(`users-public/${userRecord.uid}`).set({
      email,
      displayName,
      photoURL: "",
      lastLogin: new Date(),
    });

    res.status(201).json({
      uid: userRecord.uid,
      message: "تم إنشاء الحساب بنجاح",
    });
  } catch (err: any) {
    if (err.code === "auth/email-already-exists") {
      res.status(409).json({ error: "البريد الإلكتروني مستخدم بالفعل" });
      return;
    }
    next(err);
  }
});

router.post("/login", validate(loginSchema), async (req, res, next) => {
  try {
    const { email } = req.body;
    const userRecord = await auth.getUserByEmail(email);

    const profileSnap = await db.doc(`users/${userRecord.uid}/profile/main`).get();
    const profile = profileSnap.data();

    if (profile?.banned) {
      res.status(403).json({ error: "تم حظر حسابك" });
      return;
    }

    await db.doc(`users-public/${userRecord.uid}`).set(
      { lastLogin: new Date() },
      { merge: true }
    );

    res.json({
      uid: userRecord.uid,
      role: profile?.role || "user",
    });
  } catch (err: any) {
    if (err.code === "auth/user-not-found") {
      res.status(401).json({ error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" });
      return;
    }
    next(err);
  }
});

router.get("/profile", authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const snap = await db.doc(`users/${req.user.uid}/profile/main`).get();
    if (!snap.exists) {
      res.status(404).json({ error: "الملف الشخصي غير موجود" });
      return;
    }
    res.json({ uid: req.user.uid, ...snap.data() });
  } catch (err) {
    next(err);
  }
});

router.put("/profile", authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { displayName, companyName } = req.body;
    const updateData: Record<string, unknown> = {};

    if (displayName !== undefined) updateData.displayName = displayName;
    if (companyName !== undefined) updateData.companyName = companyName;

    if (Object.keys(updateData).length === 0) {
      res.status(400).json({ error: "لا توجد بيانات للتحديث" });
      return;
    }

    await db.doc(`users/${req.user.uid}/profile/main`).set(updateData, { merge: true });

    if (displayName) {
      await db.doc(`users-public/${req.user.uid}`).set({ displayName }, { merge: true });
    }

    res.json({ message: "تم تحديث الملف الشخصي" });
  } catch (err) {
    next(err);
  }
});

export default router;
