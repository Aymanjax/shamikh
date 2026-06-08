import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/auth";
import { adminOnly } from "../middleware/adminOnly";
import { validate } from "../middleware/validate";
import * as invoiceService from "../services/invoiceService";
import type { AuthenticatedRequest } from "../types";

const router = Router();
router.use(authenticate);

const createSchema = z.object({
  client: z.string().min(1, "اسم العميل مطلوب"),
  project: z.string().optional(),
  amount: z.number().positive("المبلغ يجب أن يكون أكبر من صفر"),
});

const statusSchema = z.object({
  status: z.enum(["draft", "pending", "paid"]),
});

router.post("/", validate(createSchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    const id = await invoiceService.createInvoice(req.user.uid, req.body);
    res.status(201).json({ id, message: "تم إنشاء الفاتورة" });
  } catch (err) {
    next(err);
  }
});

router.get("/", async (req: AuthenticatedRequest, res, next) => {
  try {
    const invoices = req.user.role === "admin"
      ? await invoiceService.listAllInvoices()
      : await invoiceService.listInvoices(req.user.uid);
    res.json({ data: invoices, total: invoices.length });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req: AuthenticatedRequest, res, next) => {
  try {
    const invoice = await invoiceService.getInvoice(req.params.id);
    if (!invoice) {
      res.status(404).json({ error: "الفاتورة غير موجودة" });
      return;
    }
    if (invoice.userId !== req.user.uid && req.user.role !== "admin") {
      res.status(403).json({ error: "غير مصرح" });
      return;
    }
    res.json(invoice);
  } catch (err) {
    next(err);
  }
});

router.put("/:id/status", validate(statusSchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    const invoice = await invoiceService.getInvoice(req.params.id);
    if (!invoice) {
      res.status(404).json({ error: "الفاتورة غير موجودة" });
      return;
    }
    if (invoice.userId !== req.user.uid && req.user.role !== "admin") {
      res.status(403).json({ error: "غير مصرح" });
      return;
    }
    await invoiceService.updateInvoiceStatus(req.params.id, req.body.status);
    res.json({ message: "تم تحديث حالة الفاتورة" });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req: AuthenticatedRequest, res, next) => {
  try {
    const invoice = await invoiceService.getInvoice(req.params.id);
    if (!invoice) {
      res.status(404).json({ error: "الفاتورة غير موجودة" });
      return;
    }
    if (invoice.userId !== req.user.uid && req.user.role !== "admin") {
      res.status(403).json({ error: "غير مصرح" });
      return;
    }
    await invoiceService.deleteInvoice(req.params.id);
    res.json({ message: "تم حذف الفاتورة" });
  } catch (err) {
    next(err);
  }
});

export default router;
