import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FolderOpen, Trash2, Eye, Search, Calculator, FileText, X, Check, HardHat,
  Bell, MessageCircle, Plus, CalendarClock, CircleDollarSign, Wallet,
} from "lucide-react";
import { Link } from "react-router-dom";
import { listDocuments, deleteDocument, addDocument } from "../../lib/firestoreService";
import GlassButton from "../../components/ui/GlassButton";
import { useAuthStore } from "../../store/authStore";
import { openWhatsApp } from "../../lib/whatsapp";
import {
  listPayments, paymentsForProject, addPayment, generateFromTemplate,
  togglePaid, deletePayment, statusOf, reminders, reminderText, humanWhen,
  type Payment,
} from "./paymentsService";
import { listExpenses, type Expense } from "../expenses/expensesService";

interface Project {
  id: string;
  name?: string;
  client?: { name?: string; phone?: string; address?: string };
  result?: { totalTiles?: number; actualArea?: number; flatArea?: number; totalCost?: number };
  input?: { slope?: number; numLegs?: number };
}

const STATUS_STYLE: Record<string, string> = {
  paid: "text-olive-700 bg-olive-50 border-olive-200",
  overdue: "text-red-600 bg-red-50 border-red-200",
  soon: "text-amber-700 bg-amber-50 border-amber-200",
  upcoming: "text-earth-600 bg-earth-50 border-earth-200",
  none: "text-earth-500 bg-earth-50 border-earth-200",
};
const STATUS_LABEL: Record<string, string> = {
  paid: "مدفوعة", overdue: "متأخرة", soon: "قريبة", upcoming: "قادمة", none: "بلا تاريخ",
};

export default function ProjectsPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState<Project | null>(null);
  const [invoiceCreated, setInvoiceCreated] = useState(false);
  const [payForm, setPayForm] = useState({ label: "", amount: 0, dueDate: "" });

  const { data: projects = [], isLoading: loading, error } = useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: () => listDocuments("projects") as Promise<Project[]>,
    staleTime: 30_000,
  });

  const { data: payments = [] } = useQuery<Payment[]>({
    queryKey: ["projectPayments", user?.uid],
    queryFn: () => listPayments(user!.uid),
    staleTime: 15_000,
    enabled: !!user,
  });

  // مصاريف الورشة المرتبطة بكل مشروع — لعرض إجمالي المصاريف وصافي الربح
  const { data: expenses = [] } = useQuery<Expense[]>({
    queryKey: ["expenses", user?.uid],
    queryFn: () => listExpenses(user!.uid),
    staleTime: 30_000,
    enabled: !!user,
  });

  const expensesByProject = useMemo(() => {
    const m: Record<string, number> = {};
    for (const e of expenses) if (e.projectId) m[e.projectId] = (m[e.projectId] || 0) + (e.amount || 0);
    return m;
  }, [expenses]);

  const invalidatePayments = () => queryClient.invalidateQueries({ queryKey: ["projectPayments"] });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteDocument("projects", id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects"] }),
  });

  const createInvoiceMutation = useMutation({
    mutationFn: (data: { client: string; project: string; amount: number; status: string; projectId: string }) =>
      addDocument("invoices", data),
    onSuccess: () => {
      setInvoiceCreated(true);
      setTimeout(() => { setInvoiceCreated(false); setDetail(null); }, 2000);
    },
  });

  const addPayMutation = useMutation({
    mutationFn: ({ project, data }: { project: Project; data: any }) => addPayment(user!.uid, project, data),
    onSuccess: () => { invalidatePayments(); setPayForm({ label: "", amount: 0, dueDate: "" }); },
  });
  const templateMutation = useMutation({
    mutationFn: ({ project, total }: { project: Project; total: number }) => generateFromTemplate(user!.uid, project, total),
    onSuccess: invalidatePayments,
  });
  const toggleMutation = useMutation({ mutationFn: (p: Payment) => togglePaid(p), onSuccess: invalidatePayments });
  const delPayMutation = useMutation({ mutationFn: (id: string) => deletePayment(id), onSuccess: invalidatePayments });

  const filtered = projects.filter((p) => !search || p.name?.toLowerCase().includes(search.toLowerCase()));
  const dueReminders = reminders(payments, 3);

  const handleDelete = useCallback((id: string, name: string) => {
    if (!confirm(`حذف المشروع "${name}"؟`)) return;
    deleteMutation.mutate(id);
  }, [deleteMutation]);

  const handleCreateInvoice = useCallback((p: Project) => {
    createInvoiceMutation.mutate({
      client: p.client?.name || "", project: p.name || "",
      amount: p.result?.totalCost || 0, status: "draft", projectId: p.id,
    });
  }, [createInvoiceMutation]);

  if (error) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm font-black text-earth-800 mb-1">تعذر تحميل المشاريع</p>
        <p className="text-xs text-earth-500">تحقق من اتصالك بالإنترنت وحاول مرة أخرى</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-sm bg-amber-600 flex items-center justify-center border-l-3 border-amber-400">
            <HardHat className="w-6 h-6 text-paper" />
          </div>
          <div>
            <h1 className="text-xl font-black text-earth-900 tracking-tight">المشاريع</h1>
            <p className="text-sm text-earth-500">المشاريع والدفعات والتنبيهات</p>
          </div>
        </div>
        <Link to="/calculator">
          <GlassButton variant="primary" size="sm" icon={<Calculator className="w-4 h-4" />}>
            حساب جديد
          </GlassButton>
        </Link>
      </div>

      {/* Payment reminders */}
      {dueReminders.length > 0 && (
        <div className="glass-card p-4" style={{ borderRightColor: "var(--accent-amber)" }}>
          <div className="flex items-center gap-2 mb-3">
            <Bell className="w-4 h-4 text-amber-600" />
            <h2 className="text-sm font-black text-earth-900">تنبيهات الدفعات</h2>
            <span className="text-xs font-black text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-sm">{dueReminders.length}</span>
          </div>
          <div className="space-y-2">
            {dueReminders.map((p) => {
              const st = statusOf(p);
              return (
                <div key={p.id} className="flex items-center justify-between gap-2 text-xs py-2 px-2 rounded-sm bg-earth-50">
                  <div className="min-w-0">
                    <p className="font-black text-earth-900 truncate">{p.label} · {p.projectName}</p>
                    <p className="text-earth-500">{p.amount} د.أ · <span className={st === "overdue" ? "text-red-600 font-black" : "text-amber-700 font-black"}>{humanWhen(p)}</span></p>
                  </div>
                  <button onClick={() => openWhatsApp(p.clientPhone, reminderText(p))}
                    className="shrink-0 bg-green-600 hover:bg-green-700 text-paper text-xs font-black py-1.5 px-3 rounded-sm transition flex items-center gap-1">
                    <MessageCircle className="w-3.5 h-3.5" /> ذكّر الزبون
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="glass-card">
        <div className="p-4 border-b border-earth-200">
          <div className="relative max-w-xs">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-earth-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث عن مشروع..." dir="rtl"
              className="w-full bg-white border-2 border-earth-200 rounded-xl py-2 pr-10 pl-3 text-sm text-earth-900 outline-none focus:border-terracotta-400 focus:ring-2 focus:ring-terracotta-100 transition"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4].map((i) => (<div key={i} className="h-14 bg-earth-200 rounded-sm animate-pulse" />))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-earth-500">
            <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-black">لا توجد مشاريع</p>
            <p className="text-xs mt-1">احسب بضاعة جديدة واحفظها كمشروع</p>
          </div>
        ) : (
          <div className="divide-y divide-earth-100">
            {filtered.map((p) => {
              const projPays = paymentsForProject(payments, p.id);
              const unpaid = projPays.filter((x) => !x.paid).reduce((s, x) => s + (x.amount || 0), 0);
              return (
                <div key={p.id} className="p-4 hover:bg-earth-50 transition-colors flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-sm bg-amber-100 border-l-2 border-amber-400 flex items-center justify-center shrink-0">
                      <FolderOpen className="w-5 h-5" style={{ color: "var(--accent-amber)" }} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-earth-900 text-sm truncate">{p.name || "بدون اسم"}</p>
                      <p className="text-xs text-earth-500">
                        {p.result?.totalTiles || 0} حبة · {p.result?.actualArea?.toFixed(1) || "0"} م²
                        {p.result?.totalCost ? ` · ${p.result.totalCost} د.أ` : ""}
                        {unpaid > 0 ? <span className="text-amber-700 font-black"> · متبقّي {unpaid} د.أ</span> : null}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => setDetail(p)} className="p-2 text-earth-500 hover:text-olive-600 transition rounded-sm hover:bg-olive-50">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(p.id, p.name || "")} className="p-2 text-earth-500 hover:text-red-500 transition rounded-sm hover:bg-red-50">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {detail && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setDetail(null)}>
          <div className="bg-white rounded-sm border border-earth-200 p-6 w-full max-w-md shadow-xl max-h-[88vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-earth-900">{detail.name}</h3>
              <button onClick={() => setDetail(null)} className="text-earth-500 hover:text-earth-700 p-1 rounded-sm" aria-label="إغلاق">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="bg-earth-50 border border-earth-200 rounded-sm p-3 grid grid-cols-2 gap-3">
                <div><span className="text-earth-500 text-xs font-bold">المساحة</span><p className="font-black text-earth-900">{detail.result?.flatArea?.toFixed(1)} م²</p></div>
                <div><span className="text-earth-500 text-xs font-bold">القرميد</span><p className="font-black text-earth-900">{detail.result?.totalTiles} حبة</p></div>
                <div><span className="text-earth-500 text-xs font-bold">الميل</span><p className="font-black text-earth-900">{detail.input?.slope}%</p></div>
                <div><span className="text-earth-500 text-xs font-bold">عدد الأرجل</span><p className="font-black text-earth-900">{detail.input?.numLegs}</p></div>
              </div>
              {detail.result?.totalCost && (
                <div className="text-paper rounded-sm p-3 flex justify-between font-black" style={{ backgroundColor: "var(--accent-amber)" }}>
                  <span>التكلفة التقديرية</span>
                  <span style={{ color: "var(--accent-amber-soft)" }}>{detail.result.totalCost} د.أ</span>
                </div>
              )}

              {/* Payments / milestones */}
              <div className="border-t border-earth-200 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-black text-earth-900 flex items-center gap-1.5 text-sm"><CircleDollarSign className="w-4 h-4 text-amber-600" /> الدفعات</h4>
                  {paymentsForProject(payments, detail.id).length === 0 && detail.result?.totalCost ? (
                    <button onClick={() => templateMutation.mutate({ project: detail, total: detail.result!.totalCost! })}
                      disabled={templateMutation.isPending}
                      className="text-xs font-black text-olive-700 bg-olive-50 hover:bg-olive-100 py-1 px-2 rounded-sm border border-olive-200 transition">
                      توليد 40/30/30
                    </button>
                  ) : null}
                </div>

                <div className="space-y-1.5 mb-3">
                  {paymentsForProject(payments, detail.id).map((p) => {
                    const st = statusOf(p);
                    return (
                      <div key={p.id} className="flex items-center gap-2 text-xs py-1.5 px-2 rounded-sm bg-earth-50 group">
                        <button onClick={() => toggleMutation.mutate(p)} title="تبديل الدفع"
                          className={`w-5 h-5 rounded-sm border-2 flex items-center justify-center shrink-0 transition ${p.paid ? "bg-olive-600 border-olive-600 text-earth-100" : "border-earth-300 hover:border-olive-400"}`}>
                          {p.paid && <Check className="w-3 h-3" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={`font-bold truncate ${p.paid ? "text-earth-400 line-through" : "text-earth-800"}`}>{p.label}</p>
                          <p className="text-earth-400 flex items-center gap-1">
                            {p.dueDate ? <><CalendarClock className="w-3 h-3" /> {p.dueDate}</> : "بلا تاريخ"}
                          </p>
                        </div>
                        <span className="font-mono font-black text-earth-900">{p.amount}</span>
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-sm border ${STATUS_STYLE[st]}`}>{STATUS_LABEL[st]}</span>
                        {!p.paid && p.dueDate && (
                          <button onClick={() => openWhatsApp(p.clientPhone || detail.client?.phone, reminderText(p))} title="ذكّر الزبون"
                            className="text-green-600 hover:text-green-700 shrink-0"><MessageCircle className="w-3.5 h-3.5" /></button>
                        )}
                        <button onClick={() => delPayMutation.mutate(p.id)} className="text-earth-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition shrink-0">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Add milestone */}
                <div className="grid grid-cols-12 gap-1.5">
                  <input value={payForm.label} onChange={(e) => setPayForm((p) => ({ ...p, label: e.target.value }))}
                    placeholder="اسم الدفعة (مثل: مرحلة العزل)"
                    className="col-span-5 bg-white border-2 border-earth-200 rounded-sm py-1.5 px-2 text-xs outline-none focus:border-amber-400" />
                  <input type="number" value={payForm.amount || ""} onChange={(e) => setPayForm((p) => ({ ...p, amount: +e.target.value }))}
                    placeholder="د.أ"
                    className="col-span-3 bg-white border-2 border-earth-200 rounded-sm py-1.5 px-2 text-xs outline-none focus:border-amber-400 font-mono" />
                  <input type="date" value={payForm.dueDate} onChange={(e) => setPayForm((p) => ({ ...p, dueDate: e.target.value }))}
                    className="col-span-4 bg-white border-2 border-earth-200 rounded-sm py-1.5 px-1 text-xs outline-none focus:border-amber-400" />
                </div>
                <button onClick={() => payForm.label.trim() && payForm.amount > 0 && addPayMutation.mutate({ project: detail, data: payForm })}
                  disabled={!payForm.label.trim() || payForm.amount <= 0 || addPayMutation.isPending}
                  className="w-full mt-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-earth-100 font-black py-1.5 rounded-sm transition text-xs flex items-center justify-center gap-1">
                  <Plus className="w-3.5 h-3.5" /> إضافة دفعة
                </button>
              </div>

              {/* المصاريف وصافي الربح: المحصّل من الدفعات − مصاريف الورشة المرتبطة بالمشروع */}
              {(() => {
                const collected = paymentsForProject(payments, detail.id)
                  .filter((p) => p.paid)
                  .reduce((s, p) => s + (p.amount || 0), 0);
                const spent = expensesByProject[detail.id] || 0;
                const profit = collected - spent;
                return (
                  <div className="border-t border-earth-200 pt-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-black text-earth-900 flex items-center gap-1.5 text-sm">
                        <Wallet className="w-4 h-4 text-amber-600" /> المصاريف والربح
                      </h4>
                      <Link to={`/expenses?project=${detail.id}`}
                        className="text-xs font-black text-amber-700 bg-amber-50 hover:bg-amber-100 py-1 px-2 rounded-sm border border-amber-200 transition">
                        سجّل مصروفًا +
                      </Link>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 text-center">
                      <div className="bg-earth-50 rounded-sm py-2 px-1">
                        <p className="text-[9px] text-earth-500 font-bold">المحصّل</p>
                        <p className="text-sm font-black font-mono text-olive-700">{collected.toFixed(0)}</p>
                      </div>
                      <div className="bg-earth-50 rounded-sm py-2 px-1">
                        <p className="text-[9px] text-earth-500 font-bold">المصاريف</p>
                        <p className="text-sm font-black font-mono text-red-600">{spent.toFixed(0)}</p>
                      </div>
                      <div className={`rounded-sm py-2 px-1 border ${profit >= 0 ? "bg-olive-50 border-olive-200" : "bg-red-50 border-red-200"}`}>
                        <p className="text-[9px] text-earth-500 font-bold">صافي الربح</p>
                        <p className={`text-sm font-black font-mono ${profit >= 0 ? "text-olive-700" : "text-red-600"}`}>{profit.toFixed(0)}</p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="flex gap-2 border-t border-earth-200 pt-3">
                <Link to="/calculator" className="flex-1 bg-olive-700 hover:bg-olive-800 text-earth-100 font-black py-2.5 rounded-sm transition text-sm text-center border-r-3 border-olive-900">
                  فتح في الحاسبة
                </Link>
                <button onClick={() => handleCreateInvoice(detail)} disabled={createInvoiceMutation.isPending}
                  className="flex-1 bg-olive-600 hover:bg-olive-700 text-earth-100 font-black py-2.5 rounded-sm transition text-sm flex items-center justify-center gap-1 border-r-3 border-olive-800">
                  {invoiceCreated ? (<><Check className="w-4 h-4" /> تم</>) : createInvoiceMutation.isPending ? ("جارٍ...") : (<><FileText className="w-4 h-4" /> فاتورة</>)}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
