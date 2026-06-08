import type { Request, Response, NextFunction } from "express";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error("[error]", err);

  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  if (err.name === "ZodError") {
    res.status(400).json({ error: "بيانات غير صالحة", details: (err as any).errors });
    return;
  }

  res.status(500).json({ error: "حدث خطأ داخلي. الرجاء المحاولة لاحقاً." });
}
