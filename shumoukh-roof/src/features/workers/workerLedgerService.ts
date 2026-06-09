// @ts-nocheck
// Worker ledger: attendance (حضور/غياب) + daily wages (يوميات) + advances (سلف).
// Net due = wages of present days − advances, over unsettled entries.
import {
  addDocument,
  updateDocument,
  deleteDocument,
  listDocumentsByUser,
} from "../../lib/firestoreService";

export type LedgerType = "day" | "advance";

export interface LedgerEntry {
  id: string;
  userId: string;
  workerId: string;
  workerName?: string;
  type: LedgerType;
  date: string; // yyyy-mm-dd (local)
  amount: number; // day → wage snapshot; advance → amount taken
  present?: boolean; // for type "day"
  note?: string;
  settledAt?: unknown | null;
}

const COLL = "workerLedger";

/** Local yyyy-mm-dd (Jordan day, not UTC). */
export function todayStr(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export function listLedger(userId: string): Promise<LedgerEntry[]> {
  return listDocumentsByUser(COLL, userId) as Promise<LedgerEntry[]>;
}

/** Unsettled entries for one worker. */
export function entriesForWorker(all: LedgerEntry[], workerId: string): LedgerEntry[] {
  return all.filter((e) => e.workerId === workerId && !e.settledAt);
}

export function findToday(all: LedgerEntry[], workerId: string, date = todayStr()): LedgerEntry | undefined {
  return all.find((e) => e.workerId === workerId && e.type === "day" && e.date === date && !e.settledAt);
}

/** Mark today's attendance (present/absent). Upserts a single day entry. */
export async function setAttendance(
  userId: string,
  worker: { id: string; name?: string; wage?: number },
  present: boolean,
  existing?: LedgerEntry,
  date = todayStr()
): Promise<void> {
  if (existing) {
    await updateDocument(COLL, existing.id, {
      present,
      amount: present ? worker.wage ?? 0 : 0,
    });
  } else {
    await addDocument(COLL, {
      userId,
      workerId: worker.id,
      workerName: worker.name || "",
      type: "day",
      date,
      present,
      amount: present ? worker.wage ?? 0 : 0,
    });
  }
}

export async function addAdvance(
  userId: string,
  worker: { id: string; name?: string },
  amount: number,
  note = "",
  date = todayStr()
): Promise<void> {
  await addDocument(COLL, {
    userId,
    workerId: worker.id,
    workerName: worker.name || "",
    type: "advance",
    date,
    amount,
    note,
  });
}

export async function deleteEntry(id: string): Promise<void> {
  await deleteDocument(COLL, id);
}

/** Stamp all current unsettled entries of a worker as settled (history kept, balance resets). */
export async function settleWorker(all: LedgerEntry[], workerId: string): Promise<void> {
  const now = new Date().toISOString();
  const open = entriesForWorker(all, workerId);
  await Promise.all(open.map((e) => updateDocument(COLL, e.id, { settledAt: now })));
}

export interface WorkerSummary {
  daysPresent: number;
  daysAbsent: number;
  earned: number;
  advances: number;
  net: number;
}

export function summarize(all: LedgerEntry[], workerId: string): WorkerSummary {
  const open = entriesForWorker(all, workerId);
  let daysPresent = 0, daysAbsent = 0, earned = 0, advances = 0;
  for (const e of open) {
    if (e.type === "day") {
      if (e.present) { daysPresent++; earned += e.amount || 0; }
      else daysAbsent++;
    } else if (e.type === "advance") {
      advances += e.amount || 0;
    }
  }
  return { daysPresent, daysAbsent, earned, advances, net: earned - advances };
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
