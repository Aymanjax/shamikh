import { collections, Timestamp } from "./firestore";
import type { Invoice, InvoiceStatus } from "../types";

const STATUSES: InvoiceStatus[] = ["draft", "pending", "paid"];

export async function createInvoice(
  uid: string,
  data: { client: string; project?: string; amount: number }
): Promise<string> {
  const id = crypto.randomUUID();
  const invoice: Invoice = {
    id,
    userId: uid,
    client: data.client,
    project: data.project,
    amount: data.amount,
    status: "draft",
    createdAt: new Date().toISOString(),
  };

  await collections.invoices.doc(id).set(invoice);
  return id;
}

export async function getInvoice(id: string): Promise<Invoice | null> {
  const snap = await collections.invoices.doc(id).get();
  if (!snap.exists) return null;
  return { ...snap.data(), id: snap.id } as Invoice;
}

export async function listInvoices(uid: string): Promise<Invoice[]> {
  const snap = await collections
    .invoices
    .where("userId", "==", uid)
    .orderBy("createdAt", "desc")
    .get();

  return snap.docs.map((d) => ({ ...d.data(), id: d.id }) as Invoice);
}

export async function listAllInvoices(): Promise<Invoice[]> {
  const snap = await collections
    .invoices
    .orderBy("createdAt", "desc")
    .get();

  return snap.docs.map((d) => ({ ...d.data(), id: d.id }) as Invoice);
}

export async function updateInvoiceStatus(
  id: string,
  status: InvoiceStatus
): Promise<void> {
  if (!STATUSES.includes(status)) throw new Error(`Invalid status: ${status}`);
  await collections.invoices.doc(id).update({ status, updatedAt: new Date().toISOString() });
}

export async function deleteInvoice(id: string): Promise<void> {
  await collections.invoices.doc(id).delete();
}
