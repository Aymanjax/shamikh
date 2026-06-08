import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../types";

export function adminOnly(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (req.user.role !== "admin") {
    res.status(403).json({ error: "غير مصرح. هذه الميزة للمديرين فقط." });
    return;
  }
  next();
}
