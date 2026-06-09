// @ts-nocheck
// Project payment milestones (الدفعات): e.g. 40% at contract, 30% at iron/wood,
// 30% at delivery — each with a due date that drives on-screen reminders.
import {
  addDocument,
  updateDocument,
  deleteDocument,
  listDocumentsByUser,
} from "../../lib/firestoreService";

export interface Payment {
  id: string;
  userId: string;
  projectId: string;
  projectName?: string;
  clientName?: string;
  clientPhone?: string;
  label: string;
  amount: number;
  dueDate?: string; // yyyy-mm-dd
  paid?: boolean;
  paidDate?: string;
  createdAt?: unknown;
}

const COLL = "projectPayments";

export function listPayments(userId: string): Promise<Payment[]> {
  return listDocumentsByUser(COLL, userId) as Promise<Payment[]>;
}

export function paymentsForProject(all: Payment[], projectId: string): Payment[] {
  return all
    .filter((p) => p.projectId === projectId)
    .sort((a, b) => (a.dueDate || "9999").localeCompare(b.dueDate || "9999"));
}

interface ProjectLike {
  id: string;
  name?: string;
  client?: { name?: string; phone?: string };
}

export async function addPayment(
  userId: string,
  project: ProjectLike,
  data: { label: string; amount: number; dueDate?: string }
): Promise<void> {
  await addDocument(COLL, {
    userId,
    projectId: project.id,
    projectName: project.name || "",
    clientName: project.client?.name || "",
    clientPhone: project.client?.phone || "",
    label: data.label,
    amount: data.amount,
    dueDate: data.dueDate || "",
    paid: false,
  });
}

/** Default Jordanian roofing schedule: 40% / 30% / 30%. */
export const DEFAULT_TEMPLATE = [
  { label: "دفعة أولى (عند العقد)", pct: 0.4 },
  { label: "دفعة ثانية (الحديد والخشب)", pct: 0.3 },
  { label: "دفعة أخيرة (عند التسليم)", pct: 0.3 },
];

export async function generateFromTemplate(
  userId: string,
  project: ProjectLike,
  total: number
): Promise<void> {
  await Promise.all(
    DEFAULT_TEMPLATE.map((m) =>
      addPayment(userId, project, { label: m.label, amount: Math.round(total * m.pct) })
    )
  );
}

export async function togglePaid(p: Payment): Promise<void> {
  await updateDocument(COLL, p.id, {
    paid: !p.paid,
    paidDate: !p.paid ? new Date().toISOString().slice(0, 10) : "",
  });
}

export async function deletePayment(id: string): Promise<void> {
  await deleteDocument(COLL, id);
}

// ── Reminder / status helpers ──
export function daysUntil(dueDate?: string): number | null {
  if (!dueDate) return null;
  const d = new Date(dueDate + "T00:00:00");
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((d.getTime() - today.getTime()) / 86400000);
}

export type PayStatus = "paid" | "overdue" | "soon" | "upcoming" | "none";

export function statusOf(p: Payment): PayStatus {
  if (p.paid) return "paid";
  const d = daysUntil(p.dueDate);
  if (d === null) return "none";
  if (d < 0) return "overdue";
  if (d <= 3) return "soon";
  return "upcoming";
}

/** Unpaid milestones with a due date, sorted by urgency (overdue/soon first). */
export function reminders(all: Payment[], withinDays = 3): Payment[] {
  return all
    .filter((p) => !p.paid && p.dueDate)
    .filter((p) => {
      const d = daysUntil(p.dueDate);
      return d !== null && d <= withinDays;
    })
    .sort((a, b) => (daysUntil(a.dueDate)! - daysUntil(b.dueDate)!));
}

export function reminderText(p: Payment): string {
  const d = daysUntil(p.dueDate);
  const when = d === null ? "" : d < 0 ? `متأخرة ${Math.abs(d)} يوم` : d === 0 ? "مستحقة اليوم" : `بعد ${d} يوم`;
  return [
    `تذكير دفعة — مشروع ${p.projectName || ""}`.trim(),
    `${p.label}: ${p.amount} د.أ`,
    p.dueDate ? `تاريخ الاستحقاق: ${p.dueDate} (${when})` : "",
  ].filter(Boolean).join("\n");
}

export function humanWhen(p: Payment): string {
  const d = daysUntil(p.dueDate);
  if (d === null) return "بدون تاريخ";
  if (d < 0) return `متأخرة ${Math.abs(d)} يوم`;
  if (d === 0) return "مستحقة اليوم";
  if (d === 1) return "متبقّي يوم";
  return `متبقّي ${d} يوم`;
}
