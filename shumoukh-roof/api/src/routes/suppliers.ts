import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/auth";
import { adminOnly } from "../middleware/adminOnly";
import { validate } from "../middleware/validate";
import * as supplierService from "../services/supplierService";
import type { AuthenticatedRequest } from "../types";

const router = Router();
router.use(authenticate);

const createSupplierSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  businessName: z.string().min(1),
  phone: z.string().optional(),
  area: z.string().optional(),
  activity: z.string().optional(),
  description: z.string().optional(),
});

const productSchema = z.object({
  name: z.string().min(1),
  price: z.number().positive(),
  unit: z.string().min(1),
  category: z.string().optional(),
  description: z.string().optional(),
});

const ratingSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
  userName: z.string().optional(),
});

const offerSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  discount: z.string().optional(),
  endDate: z.string().optional(),
});

// ── Supplier CRUD ──

router.post("/", validate(createSupplierSchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    const supplier = await supplierService.createSupplier(req.body);
    res.status(201).json(supplier);
  } catch (err: any) {
    if (err.code === "auth/email-already-exists") {
      res.status(409).json({ error: "البريد الإلكتروني مستخدم بالفعل" });
      return;
    }
    next(err);
  }
});

router.get("/", async (req: AuthenticatedRequest, res, next) => {
  try {
    const approved = req.query.approved === "true" ? true : req.query.approved === "false" ? false : undefined;
    const hasPrices = req.query.hasPrices === "true";
    const suppliers = await supplierService.listSuppliers({ approved, hasPrices });
    res.json({ data: suppliers, total: suppliers.length });
  } catch (err) {
    next(err);
  }
});

router.get("/active-offers", async (req: AuthenticatedRequest, res, next) => {
  try {
    const offers = await supplierService.getActiveOffers();
    res.json({ data: offers, total: offers.length });
  } catch (err) {
    next(err);
  }
});

router.get("/:uid", async (req: AuthenticatedRequest, res, next) => {
  try {
    const supplier = await supplierService.getSupplier(req.params.uid);
    if (!supplier) {
      res.status(404).json({ error: "المورد غير موجود" });
      return;
    }
    res.json(supplier);
  } catch (err) {
    next(err);
  }
});

router.put("/:uid", async (req: AuthenticatedRequest, res, next) => {
  try {
    if (req.user.uid !== req.params.uid && req.user.role !== "admin") {
      res.status(403).json({ error: "غير مصرح" });
      return;
    }
    await supplierService.updateSupplier(req.params.uid, req.body);
    res.json({ message: "تم تحديث المورد" });
  } catch (err) {
    next(err);
  }
});

// ── Admin: approve/ban ──

router.put("/:uid/approve", adminOnly, async (req: AuthenticatedRequest, res, next) => {
  try {
    await supplierService.approveSupplier(req.params.uid, req.body.approved !== false);
    res.json({ message: "تم تحديث حالة الموافقة" });
  } catch (err) {
    next(err);
  }
});

router.post("/:uid/ban", adminOnly, async (req: AuthenticatedRequest, res, next) => {
  try {
    await supplierService.toggleBan(req.params.uid);
    res.json({ message: "تم تحديث حالة الحظر" });
  } catch (err) {
    next(err);
  }
});

// ── Products ──

router.get("/:uid/products", async (req: AuthenticatedRequest, res, next) => {
  try {
    const products = await supplierService.getProducts(req.params.uid);
    res.json({ data: products });
  } catch (err) {
    next(err);
  }
});

router.post("/:uid/products", validate(productSchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    if (req.user.uid !== req.params.uid && req.user.role !== "admin") {
      res.status(403).json({ error: "غير مصرح" });
      return;
    }
    const id = await supplierService.addProduct(req.params.uid, req.body);
    res.status(201).json({ id, message: "تم إضافة المنتج" });
  } catch (err) {
    next(err);
  }
});

router.put("/:uid/products/:productId", async (req: AuthenticatedRequest, res, next) => {
  try {
    if (req.user.uid !== req.params.uid && req.user.role !== "admin") {
      res.status(403).json({ error: "غير مصرح" });
      return;
    }
    await supplierService.updateProduct(req.params.uid, req.params.productId, req.body);
    res.json({ message: "تم تحديث المنتج" });
  } catch (err) {
    next(err);
  }
});

router.delete("/:uid/products/:productId", async (req: AuthenticatedRequest, res, next) => {
  try {
    if (req.user.uid !== req.params.uid && req.user.role !== "admin") {
      res.status(403).json({ error: "غير مصرح" });
      return;
    }
    await supplierService.deleteProduct(req.params.uid, req.params.productId);
    res.json({ message: "تم حذف المنتج" });
  } catch (err) {
    next(err);
  }
});

// ── Ratings ──

router.get("/:uid/ratings", async (req: AuthenticatedRequest, res, next) => {
  try {
    const ratings = await supplierService.getRatings(req.params.uid);
    res.json({ data: ratings });
  } catch (err) {
    next(err);
  }
});

router.post("/:uid/ratings", validate(ratingSchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    const id = await supplierService.addRating(req.params.uid, {
      ...req.body,
      userName: req.body.userName || req.user.displayName || "مستخدم",
    });
    res.status(201).json({ id, message: "تم إضافة التقييم" });
  } catch (err) {
    next(err);
  }
});

// ── Offers ──

router.get("/:uid/offers", async (req: AuthenticatedRequest, res, next) => {
  try {
    const offers = await supplierService.getOffers(req.params.uid);
    res.json({ data: offers });
  } catch (err) {
    next(err);
  }
});

router.post("/:uid/offers", validate(offerSchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    if (req.user.uid !== req.params.uid && req.user.role !== "admin") {
      res.status(403).json({ error: "غير مصرح" });
      return;
    }
    const supplier = await supplierService.getSupplier(req.params.uid);
    const id = await supplierService.addOffer(req.params.uid, {
      ...req.body,
      supplierName: supplier?.businessName || "",
      supplierPhone: supplier?.phone || "",
    });
    res.status(201).json({ id, message: "تم إضافة العرض" });
  } catch (err) {
    next(err);
  }
});

router.delete("/offers/:offerId", async (req: AuthenticatedRequest, res, next) => {
  try {
    await supplierService.deleteOffer(req.params.offerId);
    res.json({ message: "تم حذف العرض" });
  } catch (err) {
    next(err);
  }
});

export default router;
