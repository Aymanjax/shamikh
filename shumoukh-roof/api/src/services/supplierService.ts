import { auth } from "../config/firebase";
import { collections, Timestamp } from "./firestore";
import type {
  Supplier,
  SupplierProduct,
  SupplierRating,
  Offer,
  CreateSupplierInput,
} from "../types";

// ── Supplier CRUD ──

export async function createSupplier(input: CreateSupplierInput): Promise<Supplier> {
  const userRecord = await auth.createUser({
    email: input.email,
    password: input.password,
    displayName: input.businessName,
  });

  const uid = userRecord.uid;
  const supplier: Supplier = {
    uid,
    email: input.email,
    businessName: input.businessName,
    phone: input.phone || "",
    area: input.area || "",
    activity: input.activity || "",
    description: input.description || "",
    approved: false,
    featured: false,
    banned: false,
    subscription: { plan: "free" },
    createdAt: Timestamp.now(),
  };

  await collections.suppliers.doc(uid).set(supplier);
  return supplier;
}

export async function getSupplier(uid: string): Promise<Supplier | null> {
  const snap = await collections.suppliers.doc(uid).get();
  if (!snap.exists) return null;
  return { uid: snap.id, ...snap.data() } as Supplier;
}

export async function updateSupplier(uid: string, data: Partial<Supplier>): Promise<void> {
  await collections.suppliers.doc(uid).update(data);
}

export async function deleteSupplier(uid: string): Promise<void> {
  await collections.suppliers.doc(uid).delete();
  await auth.deleteUser(uid);
}

export async function listSuppliers(options?: {
  approved?: boolean;
  hasPrices?: boolean;
}): Promise<Supplier[]> {
  let query: FirebaseFirestore.Query = collections.suppliers;

  if (options?.approved !== undefined) {
    query = query.where("approved", "==", options.approved);
  }

  const snap = await query.get();
  let suppliers = snap.docs.map((d) => ({ uid: d.id, ...d.data() }) as Supplier);

  if (options?.hasPrices) {
    suppliers = suppliers.filter(
      (s) => s.prices && Object.values(s.prices).some((v) => v > 0)
    );
  }

  return suppliers;
}

export async function approveSupplier(uid: string, approved: boolean): Promise<void> {
  await collections.suppliers.doc(uid).update({ approved });
}

export async function toggleBan(uid: string): Promise<void> {
  const supplier = await getSupplier(uid);
  if (!supplier) throw new Error("Supplier not found");
  await collections.suppliers.doc(uid).update({ banned: !supplier.banned });
}

// ── Products ──

export async function getProducts(supplierId: string): Promise<SupplierProduct[]> {
  const snap = await collections.supplierProducts(supplierId).get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as SupplierProduct);
}

export async function addProduct(
  supplierId: string,
  product: Omit<SupplierProduct, "id" | "createdAt">
): Promise<string> {
  const ref = await collections.supplierProducts(supplierId).add({
    ...product,
    createdAt: Timestamp.now(),
  });
  return ref.id;
}

export async function updateProduct(
  supplierId: string,
  productId: string,
  data: Partial<SupplierProduct>
): Promise<void> {
  await collections.supplierProducts(supplierId).doc(productId).update(data);
}

export async function deleteProduct(supplierId: string, productId: string): Promise<void> {
  await collections.supplierProducts(supplierId).doc(productId).delete();
}

// ── Ratings ──

export async function getRatings(supplierId: string): Promise<SupplierRating[]> {
  const snap = await collections.supplierRatings(supplierId).get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as SupplierRating);
}

export async function addRating(
  supplierId: string,
  rating: { userName: string; rating: number; comment?: string }
): Promise<string> {
  const ref = await collections.supplierRatings(supplierId).add({
    userName: rating.userName || "مستخدم",
    rating: rating.rating,
    comment: rating.comment || "",
    createdAt: Timestamp.now(),
  });
  return ref.id;
}

// ── Offers ──

export async function getOffers(supplierId: string): Promise<Offer[]> {
  const snap = await collections
    .offers
    .where("supplierId", "==", supplierId)
    .orderBy("createdAt", "desc")
    .get();

  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Offer);
}

export async function addOffer(
  supplierId: string,
  offer: {
    title: string;
    description?: string;
    discount?: string;
    endDate?: string;
    supplierName: string;
    supplierPhone: string;
  }
): Promise<string> {
  const ref = await collections.offers.add({
    supplierId,
    supplierName: offer.supplierName,
    supplierPhone: offer.supplierPhone,
    title: offer.title,
    description: offer.description || "",
    discount: offer.discount || "",
    endDate: offer.endDate ? Timestamp.fromDate(new Date(offer.endDate)) : null,
    active: true,
    createdAt: Timestamp.now(),
  });
  return ref.id;
}

export async function deleteOffer(offerId: string): Promise<void> {
  await collections.offers.doc(offerId).delete();
}

export async function getActiveOffers(): Promise<Offer[]> {
  const snap = await collections.offers.where("active", "==", true).get();
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as Offer)
    .filter((o) => {
      if (!o.endDate) return true;
      const end = o.endDate.toDate ? o.endDate.toDate() : new Date(o.endDate as any);
      return end > new Date();
    });
}
