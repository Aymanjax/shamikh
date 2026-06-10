// @ts-nocheck
// Worker ledger embedded INSIDE the worker document (workers/{id}.ledger).
// This reuses the workers collection's existing write permissions, so it works
// without deploying any new Firestore rule — and gives a per-worker day log.
import { updateDocument } from "../../lib/firestoreService";

export type LedgerType = "day" | "advance";

export interface LedgerEntry {
  id: string;
  type: LedgerType;
  date: string; // yyyy-mm-dd (local)
  amount: number; // day → wage snapshot; advance → amount taken
  present?: boolean; // for type "day"
  note?: string;
  settledAt?: string | null;
}

export interface WorkerDoc {
  id: string;
  name?: string;
  role?: string;
  phone?: string;
  project?: string;
  wage?: number;
  ledger?: LedgerEntry[];
}

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/** Local yyyy-mm-dd (Jordan day, not UTC). */
export function todayStr(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function persist(workerId: string, ledger: LedgerEntry[]): Promise<void> {
  return updateDocument("workers", workerId, { ledger }) as Promise<void>;
}

export function openEntries(w: WorkerDoc): LedgerEntry[] {
  return (w.ledger || []).filter((e) => !e.settledAt);
}

export function sortedEntries(w: WorkerDoc): LedgerEntry[] {
  return openEntries(w).slice().sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

export function todayEntry(w: WorkerDoc, date = todayStr()): LedgerEntry | undefined {
  return (w.ledger || []).find((e) => e.type === "day" && e.date === date && !e.settledAt);
}

/** Mark today's attendance (present/absent). Upserts a single day entry. */
export async function setAttendance(w: WorkerDoc, present: boolean, date = todayStr()): Promise<void> {
  const ledger = [...(w.ledger || [])];
  const idx = ledger.findIndex((e) => e.type === "day" && e.date === date && !e.settledAt);
  const amount = present ? w.wage ?? 0 : 0;
  if (idx >= 0) ledger[idx] = { ...ledger[idx], present, amount };
  else ledger.push({ id: uid(), type: "day", date, present, amount });
  await persist(w.id, ledger);
}

export async function addAdvance(w: WorkerDoc, amount: number, note = "", date = todayStr()): Promise<void> {
  const ledger = [...(w.ledger || []), { id: uid(), type: "advance", date, amount, note }];
  await persist(w.id, ledger);
}

export async function deleteEntry(w: WorkerDoc, entryId: string): Promise<void> {
  await persist(w.id, (w.ledger || []).filter((e) => e.id !== entryId));
}

/** Stamp current unsettled entries as settled (history kept, balance resets). */
export async function settleWorker(w: WorkerDoc): Promise<void> {
  const now = new Date().toISOString();
  await persist(w.id, (w.ledger || []).map((e) => (e.settledAt ? e : { ...e, settledAt: now })));
}

export interface WorkerSummary {
  daysPresent: number;
  daysAbsent: number;
  earned: number;
  advances: number;
  net: number;
}

export function summarize(w: WorkerDoc): WorkerSummary {
  let daysPresent = 0, daysAbsent = 0, earned = 0, advances = 0;
  for (const e of openEntries(w)) {
    if (e.type === "day") {
      if (e.present) { daysPresent++; earned += e.amount || 0; }
      else daysAbsent++;
    } else if (e.type === "advance") {
      advances += e.amount || 0;
    }
  }
  return { daysPresent, daysAbsent, earned, advances, net: earned - advances };
}

// ── Dashboard aggregates (operate on the full workers list) ──
export function aggregateOwed(workers: WorkerDoc[]): number {
  return workers.reduce((s, w) => s + Math.max(0, summarize(w).net), 0);
}

export function todayStats(workers: WorkerDoc[], date = todayStr()): { presentToday: number; advancesToday: number } {
  let presentToday = 0, advancesToday = 0;
  for (const w of workers) {
    for (const e of w.ledger || []) {
      if (e.date !== date || e.settledAt) continue;
      if (e.type === "day" && e.present) presentToday++;
      if (e.type === "advance") advancesToday += e.amount || 0;
    }
  }
  return { presentToday, advancesToday };
}

/** WhatsApp-ready statement text. */
export function statementText(name: string, s: WorkerSummary): string {
  return [
    `كشف حساب: ${name}`,
    `————————`,
    `أيام العمل: ${s.daysPresent} يوم`,
    `إجمالي الأجرة: ${s.earned} د.أ`,
    `السلف: ${s.advances} د.أ`,
    `————————`,
    `الصافي المستحق: ${s.net} د.أ`,
  ].join("\n");
}
