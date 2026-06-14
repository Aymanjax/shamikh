import { useMemo, useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import { Wallet, Plus, Trash2, CalendarDays, FolderOpen, Receipt } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { fetchProjects } from "../../services/projectService";
import { projectName, type SavedProject } from "../../utils/projectDisplay";
import {
  listExpenses, addExpense, deleteExpense, summarize, todayStr,
  CATEGORY_META, type Expense, type ExpenseCategory,
} from "./expensesService";

const CATS = Object.keys(CATEGORY_META) as ExpenseCategory[];

export default function ExpensesPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [params] = useSearchParams();
  // تصفية مبدئية بمشروع قادم من صفحة المشاريع (?project=id)
  const [filterProject, setFilterProject] = useState(params.get("project") || "");
  const [filterCat, setFilterCat] = useState<ExpenseCategory | "">("");

  const [form, setForm] = useState({
    category: "food" as ExpenseCategory,
    amount: 0,
    date: todayStr(),
    note: "",
    projectId: params.get("project") || "",
  });

  const { data: expenses = [], isLoading: loading, error } = useQuery<Expense[]>({
    queryKey: ["expenses", user?.uid],
    queryFn: () => listExpenses(user!.uid),
    staleTime: 30_000,
    enabled: !!user,
  });

  const { data: projects = [] } = useQuery<SavedProject[]>({
    queryKey: ["projects", user?.uid],
    queryFn: () => fetchProjects(user!.uid) as Promise<SavedProject[]>,
    staleTime: 60_000,
    enabled: !!user,
  });

  const projectsById = useMemo(() => {
    const m: Record<string, SavedProject> = {};
    for (const p of projects) m[p.id] = p;
    return m;
  }, [projects]);

  const addMutation = useMutation({
    mutationFn: async () => {
      const proj = form.projectId ? projectsById[form.projectId] : undefined;
      await addExpense(user!.uid, {
        category: form.category,
        amount: form.amount,
        date: form.date,
        note: form.note.trim(),
        projectId: form.projectId || undefined,
        projectName: proj ? projectName(proj) : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      setForm((f) => ({ ...f, amount: 0, note: "" }));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteExpense(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["expenses"] }),
  });

  const handleDelete = useCallback((id: string) => {
    if (!confirm("حذف هذا المصروف؟")) return;
    deleteMutation.mutate(id);
  }, [deleteMutation]);

  const filtered = useMemo(
    () => expenses.filter((e) =>
      (!filterProject || e.projectId === filterProject) &&
      (!filterCat || e.category === filterCat)
    ),
    [expenses, filterProject, filterCat]
  );

  const sums = useMemo(() => summarize(expenses), [expenses]);
  const filteredTotal = filtered.reduce((s, e) => s + (e.amount || 0), 0);

  // تجميع القائمة حسب اليوم لقراءة أسرع
  const byDay = useMemo(() => {
    const m = new Map<string, Expense[]>();
    for (const e of filtered) {
      const k = e.date || "—";
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(e);
    }
    return [...m.entries()];
  }, [filtered]);

  if (error) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm font-black text-earth-800 mb-1">تعذر تحميل المصاريف</p>
        <p className="text-xs text-earth-500">تحقق من اتصالك بالإنترنت وحاول مرة أخرى</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-sm bg-amber-600 flex items-center justify-center border-l-3 border-amber-400">
            <Wallet className="w-6 h-6 text-paper" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-earth-900 tracking-tight">مصاريف الورشة</h1>
            <p className="text-xs text-earth-500 mt-0.5">أكل، مواصلات، عدّة… سجّل كل ما تصرفه واربطه بالمشروع</p>
          </div>
        </div>
      </div>

      {/* شريط المجاميع */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass-card p-3.5">
          <p className="text-[10px] text-earth-500 font-bold">إجمالي المصاريف</p>
          <p className="text-lg font-black font-mono text-earth-900 mt-0.5">{sums.total.toFixed(1)} <span className="text-[10px] text-earth-500">د.أ</span></p>
        </div>
        <div className="glass-card p-3.5">
          <p className="text-[10px] text-earth-500 font-bold">هذا الشهر</p>
          <p className="text-lg font-black font-mono text-earth-900 mt-0.5">{sums.monthTotal.toFixed(1)} <span className="text-[10px] text-earth-500">د.أ</span></p>
        </div>
        <div className="glass-card p-3.5 col-span-2">
          <p className="text-[10px] text-earth-500 font-bold mb-1.5">حسب الفئة</p>
          <div className="flex flex-wrap gap-1.5">
            {CATS.filter((c) => sums.byCategory[c]).map((c) => (
              <span key={c} className="text-[10px] font-bold bg-earth-100 border border-earth-200 rounded-sm px-1.5 py-0.5">
                {CATEGORY_META[c].emoji} {CATEGORY_META[c].label}: <span className="font-mono">{(sums.byCategory[c] || 0).toFixed(0)}</span>
              </span>
            ))}
            {Object.keys(sums.byCategory).length === 0 && <span className="text-[10px] text-earth-400">لا بيانات بعد</span>}
          </div>
        </div>
      </div>

      {/* نموذج إضافة سريع */}
      <div className="glass-card p-4 space-y-3">
        <p className="text-xs font-black text-earth-800 flex items-center gap-1.5"><Plus className="w-3.5 h-3.5 text-amber-600" /> مصروف جديد</p>
        <div className="flex flex-wrap gap-1.5">
          {CATS.map((c) => (
            <button key={c} onClick={() => setForm((f) => ({ ...f, category: c }))}
              className={`text-xs font-bold px-2.5 py-1.5 rounded-sm border-2 transition ${
                form.category === c
                  ? "bg-amber-100 border-amber-400 text-amber-700"
                  : "bg-white border-earth-200 text-earth-600 hover:border-amber-300"
              }`}>
              {CATEGORY_META[c].emoji} {CATEGORY_META[c].label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-12 gap-2">
          <input
            type="number" min="0" step="0.5" value={form.amount || ""}
            onChange={(e) => setForm((f) => ({ ...f, amount: +e.target.value }))}
            placeholder="المبلغ د.أ"
            className="col-span-6 sm:col-span-2 bg-white border-2 border-earth-200 rounded-sm py-2 px-3 text-sm font-mono outline-none focus:border-amber-400"
          />
          <input
            type="date" value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            className="col-span-6 sm:col-span-3 bg-white border-2 border-earth-200 rounded-sm py-2 px-2 text-xs outline-none focus:border-amber-400"
          />
          <select
            value={form.projectId}
            onChange={(e) => setForm((f) => ({ ...f, projectId: e.target.value }))}
            className="col-span-12 sm:col-span-3 bg-white border-2 border-earth-200 rounded-sm py-2 px-2 text-xs outline-none focus:border-amber-400"
          >
            <option value="">بدون مشروع (مصروف عام)</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{projectName(p)}</option>
            ))}
          </select>
          <input
            value={form.note}
            onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
            placeholder="ملاحظة — مثال: بنزين، غداء العمال…"
            className="col-span-12 sm:col-span-4 bg-white border-2 border-earth-200 rounded-sm py-2 px-3 text-xs outline-none focus:border-amber-400 placeholder:text-earth-400"
          />
        </div>
        <button
          onClick={() => form.amount > 0 && addMutation.mutate()}
          disabled={form.amount <= 0 || addMutation.isPending}
          className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-earth-100 font-black py-2 px-6 rounded-sm transition text-sm flex items-center justify-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> {addMutation.isPending ? "جارٍ الحفظ..." : "تسجيل المصروف"}
        </button>
      </div>

      {/* السجل */}
      <div className="glass-card overflow-hidden">
        <div className="px-5 py-3 border-b border-earth-200 flex flex-wrap items-center gap-2 justify-between">
          <div className="flex flex-wrap items-center gap-1.5">
            <button onClick={() => setFilterCat("")}
              className={`text-[10px] font-bold px-2 py-1 rounded-sm border transition ${!filterCat ? "bg-earth-800 text-earth-100 border-earth-800" : "bg-white border-earth-200 text-earth-600"}`}>
              الكل
            </button>
            {CATS.map((c) => (
              <button key={c} onClick={() => setFilterCat(filterCat === c ? "" : c)}
                className={`text-[10px] font-bold px-2 py-1 rounded-sm border transition ${filterCat === c ? "bg-amber-100 border-amber-400 text-amber-700" : "bg-white border-earth-200 text-earth-600"}`}>
                {CATEGORY_META[c].emoji}
              </button>
            ))}
            <select
              value={filterProject}
              onChange={(e) => setFilterProject(e.target.value)}
              className="text-[10px] bg-white border border-earth-200 rounded-sm py-1 px-1.5 outline-none"
            >
              <option value="">كل المشاريع</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{projectName(p)}</option>
              ))}
            </select>
          </div>
          <span className="text-[10px] text-earth-500 font-mono">
            {filtered.length} مصروف · {filteredTotal.toFixed(1)} د.أ
          </span>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-12 rounded-sm bg-earth-200 animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-sm bg-earth-100 border-2 border-earth-200 flex items-center justify-center">
              <Receipt className="w-6 h-6 text-earth-400" />
            </div>
            <p className="text-sm font-black text-earth-700">لا توجد مصاريف</p>
            <p className="text-[10px] text-earth-500 mt-1">سجّل أول مصروف من النموذج أعلاه</p>
          </div>
        ) : (
          <div>
            {byDay.map(([day, rows]) => (
              <div key={day}>
                <div className="px-5 py-1.5 bg-earth-50 border-y border-earth-100 flex items-center justify-between">
                  <span className="text-[10px] font-black text-earth-500 flex items-center gap-1">
                    <CalendarDays className="w-3 h-3" /> {day}
                  </span>
                  <span className="text-[10px] font-mono text-earth-500">
                    {rows.reduce((s, e) => s + (e.amount || 0), 0).toFixed(1)} د.أ
                  </span>
                </div>
                <AnimatePresence mode="popLayout">
                  {rows.map((e) => (
                    <motion.div
                      key={e.id} layout
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="px-5 py-2.5 flex items-center gap-3 hover:bg-earth-50 transition-colors group border-b border-earth-100"
                    >
                      <span className="text-base shrink-0">{CATEGORY_META[e.category]?.emoji || "📦"}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-earth-800 truncate">
                          {e.note || CATEGORY_META[e.category]?.label || "مصروف"}
                        </p>
                        {e.projectName && (
                          <p className="text-[10px] text-earth-500 flex items-center gap-1 mt-0.5">
                            <FolderOpen className="w-2.5 h-2.5" /> {e.projectName}
                          </p>
                        )}
                      </div>
                      <span className="text-sm font-black font-mono text-earth-900 shrink-0">{(e.amount || 0).toFixed(1)}</span>
                      <button
                        onClick={() => handleDelete(e.id)}
                        className="p-1 text-earth-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition shrink-0"
                        title="حذف"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
