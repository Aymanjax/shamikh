import type { Response, NextFunction } from "express";
import { auth } from "../config/firebase";
import { db } from "../config/firebase";
import type { AuthenticatedRequest, AuthUser, UserRole } from "../types";

export async function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "الرجاء تسجيل الدخول أولاً" });
    return;
  }

  const token = header.slice(7);

  try {
    const decoded = await auth.verifyIdToken(token);
    const uid = decoded.uid;

    const profileSnap = await db
      .doc(`users/${uid}/profile/main`)
      .get();
    const profile = profileSnap.data();

    const user: AuthUser = {
      uid,
      email: decoded.email || "",
      role: (profile?.role as UserRole) || "user",
      displayName: profile?.displayName || decoded.name,
      companyName: profile?.companyName || "",
      banned: profile?.banned === true,
      subscription: profile?.subscription,
    };

    if (user.banned) {
      res.status(403).json({ error: "تم حظر حسابك. الرجاء التواصل مع الدعم." });
      return;
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("[auth] Token verification failed:", err);
    res.status(401).json({ error: "جلسة غير صالحة. الرجاء تسجيل الدخول مرة أخرى." });
  }
}
