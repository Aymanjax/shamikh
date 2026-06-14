// مصاريف الورشة — أكل، مواصلات، عدّة، مواد… تُسجّل يوميًا وتُربط بمشروع اختياريًا.
// مجموعة Firestore مسطّحة "workshopExpenses" مفصولة بحقل userId (نفس نمط دفعات المشاريع).
import { db } from "../../lib/firebase";
import {
  collection, addDoc, deleteDoc, doc, getDocs, query, where, Timestamp,
} from "firebase/firestore";

export type ExpenseCategory = "food" | "transport" | "tools" | "materials" | "other";

export interface Expense {
  id: string;
  userId: string;
  projectId?: string;
  projectName?: string;
  category: ExpenseCategory;
  amount: number;
  note?: string;
  date: string; // yyyy-mm-dd
  createdAt?: unknown;
}

export const CATEGORY_META: Record<ExpenseCategory, { label: string; emoji: string }> = {
  food: { label: "أكل وشرب", emoji: "🍽️" },
  transport: { label: "سيارة ومواصلات", emoji: "🚗" },
  tools: { label: "عدّة وأدوات", emoji: "🔧" },
  materials: { label: "مواد", emoji: "🧱" },
  other: { label: "أخرى", emoji: "📦" },
};

const COLL = "workshopExpenses";

export function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export async function listExpenses(userId: string): Promise<Expense[]> {
  // تصفية بالمستخدم فقط والفرز محليًا — يتجنّب الحاجة لفهرس مركّب (نفس نمط الدفعات)
  const q1 = query(collection(db, COLL), where("userId", "==", userId));
  const snap = await getDocs(q1);
  const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Expense[];
  return rows.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
}

export async function addExpense(
  userId: string,
  data: { category: ExpenseCategory; amount: number; date: string; note?: string; projectId?: string; projectName?: string }
): Promise<void> {
  await addDoc(collection(db, COLL), {
    userId,
    category: data.category,
    amount: data.amount,
    date: data.date,
    note: data.note || "",
    projectId: data.projectId || "",
    projectName: data.projectName || "",
    createdAt: Timestamp.now(),
  });
}

export async function deleteExpense(id: string): Promise<void> {
  await deleteDoc(doc(db, COLL, id));
}

/** مجاميع جاهزة للعرض: الكل، هذا الشهر، حسب الفئة، حسب المشروع */
export function summarize(expenses: Expense[]) {
  const month = todayStr().slice(0, 7);
  const total = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const monthTotal = expenses.filter((e) => (e.date || "").startsWith(month)).reduce((s, e) => s + (e.amount || 0), 0);
  const byCategory = {} as Record<ExpenseCategory, number>;
  const byProject: Record<string, number> = {};
  for (const e of expenses) {
    byCategory[e.category] = (byCategory[e.category] || 0) + (e.amount || 0);
    if (e.projectId) byProject[e.projectId] = (byProject[e.projectId] || 0) + (e.amount || 0);
  }
  return { total, monthTotal, byCategory, byProject };
}
