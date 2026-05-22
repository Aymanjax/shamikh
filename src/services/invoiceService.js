import { db } from "./firebase";
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, orderBy, runTransaction } from "firebase/firestore";

export function getInvoicesRef(userId) {
  return collection(db, "users", userId, "invoices");
}

export function getInvoiceRef(userId, invoiceId) {
  return doc(db, "users", userId, "invoices", invoiceId);
}

function getCounterRef(userId) {
  return doc(db, "users", userId, "config", "invoiceCounter");
}

async function generateInvoiceNumber(userId) {
  const counterRef = getCounterRef(userId);
  const now = new Date();
  const year = now.getFullYear();

  try {
    const result = await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(counterRef);
      let lastNumber = 0;
      let lastYear = year;

      if (snap.exists()) {
        const data = snap.data();
        lastNumber = data.lastNumber || 0;
        lastYear = data.year || year;
      }

      if (lastYear !== year) {
        lastNumber = 0;
      }

      const newNumber = lastNumber + 1;
      transaction.set(counterRef, { lastNumber: newNumber, year }, { merge: true });

      return newNumber;
    });

    return `INV-${year}-${String(result).padStart(4, "0")}`;
  } catch {
    const fallback = `INV-${year}-${String(Math.floor(Math.random() * 9999)).padStart(4, "0")}`;
    return fallback;
  }
}

export async function createInvoice(userId, data) {
  const id = crypto.randomUUID();
  const invoiceNumber = await generateInvoiceNumber(userId);
  const invoice = {
    id,
    invoiceNumber,
    ...data,
    payments: [],
    paidAmount: 0,
    status: "unpaid",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await setDoc(getInvoiceRef(userId, id), invoice);
  return id;
}

export async function fetchInvoices(userId) {
  const q = query(getInvoicesRef(userId), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data());
}

export async function fetchInvoice(userId, id) {
  const snap = await getDoc(getInvoiceRef(userId, id));
  return snap.exists() ? snap.data() : null;
}

export async function updateInvoice(userId, id, data) {
  await updateDoc(getInvoiceRef(userId, id), { ...data, updatedAt: new Date().toISOString() });
}

export async function deleteInvoice(userId, id) {
  await deleteDoc(getInvoiceRef(userId, id));
}

export async function addInvoicePayment(userId, invoiceId, payment) {
  const ref = getInvoiceRef(userId, invoiceId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("الفاتورة غير موجودة");
  const invoice = snap.data();
  const payments = invoice.payments || [];
  const paymentId = crypto.randomUUID();
  const newPayment = { id: paymentId, amount: Number(payment.amount), note: payment.note || "", date: new Date().toISOString() };
  payments.push(newPayment);
  const totalPayments = payments.reduce((s, p) => s + p.amount, 0);
  let status = invoice.status;
  if (totalPayments >= (invoice.total || 0)) {
    status = "paid";
  } else if (totalPayments > 0) {
    status = "partial";
  }
  await updateDoc(ref, { payments, paidAmount: totalPayments, status, updatedAt: new Date().toISOString() });
  return newPayment;
}

export async function deleteInvoicePayment(userId, invoiceId, paymentId) {
  const ref = getInvoiceRef(userId, invoiceId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const invoice = snap.data();
  const payments = (invoice.payments || []).filter((p) => p.id !== paymentId);
  const totalPayments = payments.reduce((s, p) => s + p.amount, 0);
  let status = "unpaid";
  if (totalPayments >= (invoice.total || 0)) {
    status = "paid";
  } else if (totalPayments > 0) {
    status = "partial";
  }
  await updateDoc(ref, { payments, paidAmount: totalPayments, status, updatedAt: new Date().toISOString() });
}

export const INVOICE_STATUSES = ["unpaid", "partial", "paid", "cancelled"];
export const INVOICE_STATUS_LABELS = { unpaid: "غير مدفوعة", partial: "مدفوعة جزئياً", paid: "مدفوعة", cancelled: "ملغية" };
export const INVOICE_STATUS_COLORS = {
  unpaid: "bg-red-50 text-red-600 border-red-200",
  partial: "bg-amber-50 text-amber-600 border-amber-200",
  paid: "bg-emerald-50 text-emerald-600 border-emerald-200",
  cancelled: "bg-slate-100 text-slate-500 border-slate-200",
};
