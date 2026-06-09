import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users, Plus, MapPin, X, Trash2, HardHat,
  Wallet, CalendarCheck, CalendarX, FileText, MessageCircle, CheckCircle2,
} from "lucide-react";
import { listDocumentsByUser, addDocument, deleteDocument } from "../../lib/firestoreService";
import { useAuthStore } from "../../store/authStore";
import SubscriptionGuard from "../../components/SubscriptionGuard";
import GlassButton from "../../components/ui/GlassButton";
import { openWhatsApp } from "../../lib/whatsapp";
import {
  listLedger, setAttendance, addAdvance, settleWorker, summarize,
  findToday, statementText, entriesForWorker, deleteEntry,
  type LedgerEntry,
} from "./workerLedgerService";

interface Worker {
  id: string;
  name?: string;
  role?: string;
  phone?: string;
  project?: string;
  wage?: number;
  days?: number;
}

interface WorkerForm {
  name: string;
  role: string;
  phone: string;
  project: string;
  wage: number;
}

const defaultForm: WorkerForm = { name: "", role: "مبلط", phone: "", project: "", wage: 25 };
const roles = ["مبلط", "حداد", "مساعد", "عامل", "مشرف", "سائق"];

export default function WorkersPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<WorkerForm>(defaultForm);
  const [advanceFor, setAdvanceFor] = useState<Worker | null>(null);
  const [advanceForm, setAdvanceForm] = useState({ amount: 20, note: "" });
  const [statementFor, setStatementFor] = useState<Worker | null>(null);

  const { data: workers = [], isLoading: loading, error } = useQuery<Worker[]>({
    queryKey: ["workers", user?.uid],
    queryFn: () => listDocumentsByUser("workers", user!.uid) as Promise<Worker[]>,
    staleTime: 30_000,
    enabled: !!user,
  });

  const { data: ledger = [] } = useQuery<LedgerEntry[]>({
    queryKey: ["workerLedger", user?.uid],
    queryFn: () => listLedger(user!.uid),
    staleTime: 15_000,
    enabled: !!user,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["workers"] });
    queryClient.invalidateQueries({ queryKey: ["workerLedger"] });
  };

  const createMutation = useMutation({
    mutationFn: (data: WorkerForm) => addDocument("workers", { ...data, days: 0, userId: user!.uid }),
    onSuccess: () => { invalidate(); setModal(false); setForm(defaultForm); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteDocument("workers", id),
    onSuccess: invalidate,
  });

  const attendMutation = useMutation({
    mutationFn: ({ worker, present }: { worker: Worker; present: boolean }) =>
      setAttendance(user!.uid, worker, present, findToday(ledger, worker.id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workerLedger"] }),
  });

  const advanceMutation = useMutation({
    mutationFn: ({ worker, amount, note }: { worker: Worker; amount: number; note: string }) =>
      addAdvance(user!.uid, worker, amount, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workerLedger"] });
      setAdvanceFor(null);
      setAdvanceForm({ amount: 20, note: "" });
    },
  });

  const settleMutation = useMutation({
    mutationFn: (workerId: string) => settleWorker(ledger, workerId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["workerLedger"] }); setStatementFor(null); },
  });

  const handleCreate = useCallback(() => {
    if (!form.name.trim()) return;
    createMutation.mutate(form);
  }, [form, createMutation]);

  const handleDelete = useCallback((id: string, name: string) => {
    if (!confirm(`حذف العامل "${name}"؟`)) return;
    deleteMutation.mutate(id);
  }, [deleteMutation]);

  if (error) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm font-black text-earth-800 mb-1">تعذر تحميل بيانات العمال</p>
        <p className="text-xs text-earth-500">تحقق من اتصالك بالإنترنت وحاول مرة أخرى</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-sm bg-red-600 flex items-center justify-center border-l-3 border-red-400">
            <HardHat className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-earth-900 tracking-tight">العمال</h1>
            <p className="text-sm text-earth-500">الحضور · السلف · حساب اليوميات</p>
          </div>
        </div>
        <GlassButton variant="primary" size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setModal(true)}>
          إضافة عامل
        </GlassButton>
      </div>

      <SubscriptionGuard permission="canManageWorkers">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-52 bg-earth-200 rounded-sm animate-pulse" />
            ))}
          </div>
        ) : workers.length === 0 ? (
          <div className="glass-card py-16 text-center text-earth-500">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-black">لا يوجد عمال</p>
            <p className="text-xs mt-1">أضف عامل جديد للبدء</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workers.map((w) => {
              const s = summarize(ledger, w.id);
              const today = findToday(ledger, w.id);
              return (
                <div key={w.id} className="glass-card p-4 transition-all duration-150 hover:shadow-card-hover">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-sm bg-red-600 flex items-center justify-center text-white font-black text-sm">
                      {w.name?.charAt(0) || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-black text-earth-900 text-sm truncate">{w.name}</h3>
                      <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-sm">{w.role}</span>
                      {w.project && <span className="text-[10px] text-earth-400 mr-1"><MapPin className="w-3 h-3 inline" /> {w.project}</span>}
                    </div>
                    <button
                      onClick={() => handleDelete(w.id, w.name || "")}
                      className="text-earth-500 hover:text-red-500 transition cursor-pointer p-1 rounded-sm"
                      aria-label={`حذف العامل ${w.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Today's attendance */}
                  <div className="flex items-center gap-1.5 mb-3">
                    <span className="text-[10px] font-bold text-earth-400 ml-1">اليوم:</span>
                    <button
                      onClick={() => attendMutation.mutate({ worker: w, present: true })}
                      className={`flex-1 text-xs font-black py-1.5 rounded-sm transition flex items-center justify-center gap-1 border-2 ${
                        today?.present
                          ? "bg-olive-600 text-white border-olive-600"
                          : "bg-white text-earth-500 border-earth-200 hover:border-olive-300"
                      }`}>
                      <CalendarCheck className="w-3.5 h-3.5" /> حاضر
                    </button>
                    <button
                      onClick={() => attendMutation.mutate({ worker: w, present: false })}
                      className={`flex-1 text-xs font-black py-1.5 rounded-sm transition flex items-center justify-center gap-1 border-2 ${
                        today && today.present === false
                          ? "bg-red-600 text-white border-red-600"
                          : "bg-white text-earth-500 border-earth-200 hover:border-red-300"
                      }`}>
                      <CalendarX className="w-3.5 h-3.5" /> غائب
                    </button>
                  </div>

                  {/* Summary */}
                  <div className="grid grid-cols-3 gap-1.5 mb-3 text-center">
                    <div className="bg-earth-50 rounded-sm py-1.5">
                      <div className="text-sm font-black text-earth-900 font-mono">{s.daysPresent}</div>
                      <div className="text-[9px] text-earth-500">يوم</div>
                    </div>
                    <div className="bg-earth-50 rounded-sm py-1.5">
                      <div className="text-sm font-black text-amber-600 font-mono">{s.advances}</div>
                      <div className="text-[9px] text-earth-500">سلف د.أ</div>
                    </div>
                    <div className="bg-olive-50 rounded-sm py-1.5">
                      <div className="text-sm font-black text-olive-700 font-mono">{s.net}</div>
                      <div className="text-[9px] text-earth-500">الصافي</div>
                    </div>
                  </div>

                  {/* Quick actions */}
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => { setAdvanceFor(w); setAdvanceForm({ amount: 20, note: "" }); }}
                      className="flex-1 text-xs font-black text-amber-700 bg-amber-50 hover:bg-amber-100 py-1.5 rounded-sm transition flex items-center justify-center gap-1 border-2 border-amber-200">
                      <Wallet className="w-3.5 h-3.5" /> سلفة
                    </button>
                    <button onClick={() => setStatementFor(w)}
                      className="flex-1 text-xs font-black text-earth-700 bg-earth-100 hover:bg-earth-200 py-1.5 rounded-sm transition flex items-center justify-center gap-1 border-2 border-earth-200">
                      <FileText className="w-3.5 h-3.5" /> كشف
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SubscriptionGuard>

      {/* Add worker modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setModal(false)}>
          <div className="bg-white rounded-sm border border-earth-200 p-6 w-full max-w-sm shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-earth-900">إضافة عامل</h3>
              <button onClick={() => setModal(false)} className="text-earth-500 hover:text-earth-700 p-1 rounded-sm" aria-label="إغلاق">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-earth-700">الاسم</label>
                  <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    className="w-full bg-white border-2 border-earth-200 rounded-xl py-2.5 px-3 text-sm text-earth-900 outline-none focus:border-terracotta-400 focus:ring-2 focus:ring-terracotta-100 transition" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-earth-700">المهنة</label>
                  <select value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                    className="w-full bg-white border-2 border-earth-200 rounded-xl py-2.5 px-3 text-sm text-earth-900 outline-none focus:border-terracotta-400 focus:ring-2 focus:ring-terracotta-100 transition">
                    {roles.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-earth-700">الهاتف</label>
                <input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                  dir="ltr"
                  className="w-full bg-white border-2 border-earth-200 rounded-xl py-2.5 px-3 text-sm text-earth-900 outline-none focus:border-terracotta-400 focus:ring-2 focus:ring-terracotta-100 transition" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-earth-700">المشروع</label>
                <input value={form.project} onChange={(e) => setForm((p) => ({ ...p, project: e.target.value }))}
                  className="w-full bg-white border-2 border-earth-200 rounded-xl py-2.5 px-3 text-sm text-earth-900 outline-none focus:border-terracotta-400 focus:ring-2 focus:ring-terracotta-100 transition" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-earth-700">أجرة اليوم (د.أ)</label>
                <input type="number" value={form.wage} onChange={(e) => setForm((p) => ({ ...p, wage: +e.target.value }))}
                  className="w-full bg-white border-2 border-earth-200 rounded-xl py-2.5 px-3 text-sm text-earth-900 outline-none focus:border-terracotta-400 focus:ring-2 focus:ring-terracotta-100 transition font-mono" />
              </div>
              <button onClick={handleCreate} disabled={!form.name.trim() || createMutation.isPending}
                className="w-full bg-olive-700 hover:bg-olive-800 disabled:opacity-40 text-white font-black py-2.5 rounded-sm transition text-sm border-r-3 border-olive-900">
                {createMutation.isPending ? "جارٍ الإضافة..." : "إضافة"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Advance modal */}
      {advanceFor && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setAdvanceFor(null)}>
          <div className="bg-white rounded-sm border border-earth-200 p-6 w-full max-w-sm shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-earth-900 flex items-center gap-2"><Wallet className="w-4 h-4 text-amber-600" /> سلفة لـ {advanceFor.name}</h3>
              <button onClick={() => setAdvanceFor(null)} className="text-earth-500 hover:text-earth-700 p-1 rounded-sm" aria-label="إغلاق">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-earth-700">المبلغ (د.أ)</label>
                <input type="number" autoFocus value={advanceForm.amount} onChange={(e) => setAdvanceForm((p) => ({ ...p, amount: +e.target.value }))}
                  className="w-full bg-white border-2 border-earth-200 rounded-xl py-2.5 px-3 text-lg text-earth-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition font-mono text-center" />
              </div>
              <div className="flex gap-1.5">
                {[10, 20, 50, 100].map((v) => (
                  <button key={v} onClick={() => setAdvanceForm((p) => ({ ...p, amount: v }))}
                    className="flex-1 text-xs font-black py-1.5 rounded-sm border-2 border-earth-200 hover:border-amber-300 text-earth-700 transition">{v}</button>
                ))}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-earth-700">ملاحظة (اختياري)</label>
                <input value={advanceForm.note} onChange={(e) => setAdvanceForm((p) => ({ ...p, note: e.target.value }))}
                  placeholder="سلفة على السريع / للجمعة..."
                  className="w-full bg-white border-2 border-earth-200 rounded-xl py-2.5 px-3 text-sm text-earth-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition" />
              </div>
              <button
                onClick={() => advanceMutation.mutate({ worker: advanceFor, amount: advanceForm.amount, note: advanceForm.note })}
                disabled={advanceForm.amount <= 0 || advanceMutation.isPending}
                className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white font-black py-2.5 rounded-sm transition text-sm border-r-3 border-amber-800">
                {advanceMutation.isPending ? "جارٍ التسجيل..." : "تسجيل السلفة"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Statement modal */}
      {statementFor && (() => {
        const s = summarize(ledger, statementFor.id);
        const entries = entriesForWorker(ledger, statementFor.id).sort((a, b) => (a.date < b.date ? 1 : -1));
        return (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setStatementFor(null)}>
            <div className="bg-white rounded-sm border border-earth-200 p-6 w-full max-w-md shadow-xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-earth-900 flex items-center gap-2"><FileText className="w-4 h-4 text-earth-600" /> كشف حساب {statementFor.name}</h3>
                <button onClick={() => setStatementFor(null)} className="text-earth-500 hover:text-earth-700 p-1 rounded-sm" aria-label="إغلاق">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                <div className="bg-earth-50 rounded-sm py-2"><div className="text-base font-black text-earth-900 font-mono">{s.earned}</div><div className="text-[10px] text-earth-500">أجرة ({s.daysPresent} يوم)</div></div>
                <div className="bg-amber-50 rounded-sm py-2"><div className="text-base font-black text-amber-600 font-mono">{s.advances}</div><div className="text-[10px] text-earth-500">سلف</div></div>
                <div className="bg-olive-50 rounded-sm py-2"><div className="text-base font-black text-olive-700 font-mono">{s.net}</div><div className="text-[10px] text-earth-500">الصافي</div></div>
              </div>

              <div className="space-y-1 mb-4 max-h-52 overflow-y-auto">
                {entries.length === 0 && <p className="text-xs text-earth-400 text-center py-4">لا توجد حركات</p>}
                {entries.map((e) => (
                  <div key={e.id} className="flex items-center justify-between text-xs py-1.5 px-2 rounded-sm hover:bg-earth-50 group">
                    <span className="flex items-center gap-1.5">
                      {e.type === "advance"
                        ? <Wallet className="w-3.5 h-3.5 text-amber-600" />
                        : e.present ? <CalendarCheck className="w-3.5 h-3.5 text-olive-600" /> : <CalendarX className="w-3.5 h-3.5 text-red-500" />}
                      <span className="text-earth-700 font-bold">
                        {e.type === "advance" ? "سلفة" : e.present ? "حضور" : "غياب"}
                        {e.note ? ` · ${e.note}` : ""}
                      </span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="text-earth-400 font-mono text-[10px]">{e.date}</span>
                      {e.type !== "day" || e.present ? (
                        <span className={`font-mono font-black ${e.type === "advance" ? "text-amber-600" : "text-olive-700"}`}>
                          {e.type === "advance" ? "−" : "+"}{e.amount} د.أ
                        </span>
                      ) : <span className="font-mono text-red-400">غائب</span>}
                      <button onClick={() => deleteEntry(e.id).then(() => queryClient.invalidateQueries({ queryKey: ["workerLedger"] }))}
                        className="opacity-0 group-hover:opacity-100 text-earth-400 hover:text-red-500 transition" aria-label="حذف الحركة">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openWhatsApp(statementFor.phone, statementText(statementFor.name || "العامل", s))}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-black py-2.5 rounded-sm transition text-sm flex items-center justify-center gap-1.5">
                  <MessageCircle className="w-4 h-4" /> إرسال واتساب
                </button>
                <button
                  onClick={() => { if (confirm(`تصفية حساب ${statementFor.name}؟ سيُصفّر الصافي ويُحفظ السجل.`)) settleMutation.mutate(statementFor.id); }}
                  disabled={settleMutation.isPending || (s.daysPresent === 0 && s.advances === 0)}
                  className="flex-1 bg-earth-800 hover:bg-earth-900 disabled:opacity-40 text-white font-black py-2.5 rounded-sm transition text-sm flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> تصفية الحساب
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
