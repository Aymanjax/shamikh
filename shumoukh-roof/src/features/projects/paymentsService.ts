// @ts-nocheck
// Payment milestones embedded INSIDE the project document (projects/{id}.payments).
// Reuses the projects collection's existing write permissions — works without a
// new Firestore rule.
import { updateDocument } from "../../lib/firestoreService";

export interface Payment {
  id: string;
  label: string;
  amount: number;
  dueDate?: string; // yyyy-mm-dd
  paid?: boolean;
  paidDate?: string;
}

export interface ProjectDoc {
  id: string;
  name?: string;
  client?: { name?: string; phone?: string };
  result?: { totalCost?: number };
  payments?: Payment[];
}

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function persist(projectId: string, payments: Payment[]): Promise<void> {
  return updateDocument("projects", projectId, { payments }) as Promise<void>;
}

export function paymentsOf(project: ProjectDoc): Payment[] {
  return (project.payments || [])
    .slice()
    .sort((a, b) => (a.dueDate || "9999").localeCompare(b.dueDate || "9999"));
}

export async function addPayment(
  project: ProjectDoc,
  data: { label: string; amount: number; dueDate?: string }
): Promise<void> {
  const payments = [
    ...(project.payments || []),
    { id: uid(), label: data.label, amount: data.amount, dueDate: data.dueDate || "", paid: false },
  ];
  await persist(project.id, payments);
}

/** Default Jordanian roofing schedule: 40% / 30% / 30%. */
export const DEFAULT_TEMPLATE = [
  { label: "دفعة أولى (عند العقد)", pct: 0.4 },
  { label: "دفعة ثانية (الحديد والخشب)", pct: 0.3 },
  { label: "دفعة أخيرة (عند التسليم)", pct: 0.3 },
];

export async function generateFromTemplate(project: ProjectDoc, total: number): Promise<void> {
  const payments = [
    ...(project.payments || []),
    ...DEFAULT_TEMPLATE.map((m) => ({ id: uid(), label: m.label, amount: Math.round(total * m.pct), dueDate: "", paid: false })),
  ];
  await persist(project.id, payments);
}

export async function togglePaid(project: ProjectDoc, paymentId: string): Promise<void> {
  const payments = (project.payments || []).map((p) =>
    p.id === paymentId ? { ...p, paid: !p.paid, paidDate: !p.paid ? new Date().toISOString().slice(0, 10) : "" } : p
  );
  await persist(project.id, payments);
}

export async function deletePayment(project: ProjectDoc, paymentId: string): Promise<void> {
  await persist(project.id, (project.payments || []).filter((p) => p.id !== paymentId));
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

export interface DueItem { project: ProjectDoc; payment: Payment; }

/** Unpaid milestones (with due date) within N days, across all projects, urgent first. */
export function reminders(projects: ProjectDoc[], withinDays = 3): DueItem[] {
  const items: DueItem[] = [];
  for (const project of projects) {
    for (const payment of project.payments || []) {
      if (payment.paid || !payment.dueDate) continue;
      const d = daysUntil(payment.dueDate);
      if (d !== null && d <= withinDays) items.push({ project, payment });
    }
  }
  return items.sort((a, b) => (daysUntil(a.payment.dueDate)! - daysUntil(b.payment.dueDate)!));
}

/** Total still owed by clients (unpaid milestones across all projects). */
export function totalReceivable(projects: ProjectDoc[]): number {
  return projects.reduce(
    (s, p) => s + (p.payments || []).filter((x) => !x.paid).reduce((t, x) => t + (x.amount || 0), 0),
    0
  );
}

export function reminderText(project: ProjectDoc, p: Payment): string {
  const d = daysUntil(p.dueDate);
  const when = d === null ? "" : d < 0 ? `متأخرة ${Math.abs(d)} يوم` : d === 0 ? "مستحقة اليوم" : `بعد ${d} يوم`;
  return [
    `تذكير دفعة — مشروع ${project.name || ""}`.trim(),
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
