import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Plus, Search, Download, Trash2, X, Check, Receipt, User, Hash, DollarSign, MessageCircle, Pencil, Package } from "lucide-react";
import { listDocumentsByUser, addDocument, deleteDocument, updateDocument } from "../../lib/firestoreService";
import { useAuthStore } from "../../store/authStore";
import { printInvoice } from "../../lib/printInvoice";
import { openWhatsApp } from "../../lib/whatsapp";
import GlassButton from "../../components/ui/GlassButton";

interface LineItem {
  name: string;
  qty: number;
  unit: string;
  price: number;
}

interface Invoice {
  id: string;
  client?: string;
  project?: string;
  phone?: string;
  amount?: number;
  items?: LineItem[];
  status?: string;
  projectId?: string;
  createdAt?: unknown;
}

interface InvoiceForm {
  client: string;
  project: string;
  phone: string;
  amount: number;
  items: LineItem[];
  status: string;
}

const emptyForm = (): InvoiceForm => ({ client: "", project: "", phone: "", amount: 0, items: [], status: "draft" });

const itemsTotal = (items: LineItem[]): number =>
  items.reduce((s, it) => s + (it.qty || 0) * (it.price || 0), 0);

const invoiceTotal = (inv: { items?: LineItem[]; amount?: number }): number =>
  inv.items && inv.items.length ? itemsTotal(inv.items) : inv.amount || 0;

const statusConfig: Record<string, { label: string; color: string; next: string }> = {
  paid: { label: "مدفوعة", color: "tag-olive", next: "draft" },
  pending: { label: "قيد الانتظار", color: "tag-amber", next: "paid" },
  draft: { label: "مسودة", color: "bg-earth-100 text-earth-700 border border-earth-300 rounded-[3px]", next: "pending" },
};

const countLabel = (n: number): string => {
  if (n === 0) return "لا توجد فواتير";
  if (n === 1) return "فاتورة واحدة";
  if (n === 2) return "فاتورتان";
  if (n <= 10) return `${n} فواتير`;
  return `${n} فاتورة`;
};

/** WhatsApp message — a price quote for drafts, an invoice otherwise. */
function invoiceText(inv: Invoice): string {
  const head = inv.status === "draft" ? "عرض سعر" : "فاتورة";
  const lines = (inv.items || []).filter((i) => i.name).map((i) => `- ${i.name}: ${i.qty} ${i.unit}${i.price ? ` × ${i.price} = ${i.qty * i.price} د.أ` : ""}`);
  return [
    head,
    `العميل: ${inv.client || ""}`,
    inv.project ? `المشروع: ${inv.project}` : "",
    ...(lines.length ? ["————————", ...lines, "————————"] : []),
    `الإجمالي: ${invoiceTotal(inv)} د.أ`,
  ].filter(Boolean).join("\n");
}

export default function InvoicesPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<InvoiceForm>(emptyForm());
  const [clientError, setClientError] = useState(false);
  const clientInputRef = useRef<HTMLInputElement>(null);

  const { data: invoices = [], isLoading: loading, error } = useQuery<Invoice[]>({
    queryKey: ["invoices", user?.uid],
    queryFn: () => listDocumentsByUser("invoices", user!.uid) as Promise<Invoice[]>,
    staleTime: 30_000,
    enabled: !!user,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["invoices"] });

  const saveMutation = useMutation({
    mutationFn: async (data: InvoiceForm) => {
      const payload = { ...data, amount: data.items.length ? itemsTotal(data.items) : data.amount };
      if (editId) await updateDocument("invoices", editId, payload);
      else await addDocument("invoices", { ...payload, userId: user!.uid });
    },
    onSuccess: () => { invalidate(); closeModal(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteDocument("invoices", id),
    onSuccess: invalidate,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateDocument("invoices", id, { status }),
    onSuccess: invalidate,
  });

  const closeModal = () => { setModal(false); setEditId(null); setForm(emptyForm()); setClientError(false); };

  const openCreate = () => { setForm(emptyForm()); setEditId(null); setModal(true); };
  const openEdit = (inv: Invoice) => {
    setForm({
      client: inv.client || "", project: inv.project || "", phone: inv.phone || "",
      amount: inv.amount || 0, items: inv.items ? inv.items.map((i) => ({ ...i })) : [], status: inv.status || "draft",
    });
    setEditId(inv.id);
    setModal(true);
  };

  const handleSave = useCallback(() => {
    if (!form.client.trim()) { setClientError(true); clientInputRef.current?.focus(); return; }
    saveMutation.mutate(form);
  }, [form, saveMutation]);

  const handleDelete = useCallback((id: string) => {
    if (!confirm("حذف هذه الفاتورة؟ لا يمكن التراجع عن الحذف.")) return;
    deleteMutation.mutate(id);
  }, [deleteMutation]);

  // ── Line-item editing ──
  const addItem = () => setForm((p) => ({ ...p, items: [...p.items, { name: "", qty: 1, unit: "حبة", price: 0 }] }));
  const updateItem = (i: number, patch: Partial<LineItem>) =>
    setForm((p) => ({ ...p, items: p.items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)) }));
  const removeItem = (i: number) => setForm((p) => ({ ...p, items: p.items.filter((_, idx) => idx !== i) }));

  const filtered = invoices.filter((inv) => !search || inv.client?.includes(search) || inv.project?.includes(search));

  if (error) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm font-black text-earth-800 mb-1">تعذر تحميل الفواتير</p>
        <p className="text-xs text-earth-500">تحقق من اتصالك بالإنترنت وحاول مرة أخرى</p>
      </div>
    );
  }

  const formTotal = form.items.length ? itemsTotal(form.items) : form.amount;

  return (
    <div className="space-y-0">
      {/* Page header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-sm bg-olive-600 flex items-center justify-center border-l-3 border-olive-400">
            <Receipt className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-earth-900 tracking-tight">الفواتير</h1>
            <p className="text-xs text-earth-500 mt-0.5">الفواتير وعروض الأسعار والبنود</p>
          </div>
        </div>
        <GlassButton variant="primary" size="sm" icon={<Plus className="w-4 h-4" />} onClick={openCreate}>
          فاتورة جديدة
        </GlassButton>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-earth-200 flex items-center justify-between">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-earth-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ابحث باسم العميل أو المشروع"
              className="w-full bg-white border-2 border-earth-200 rounded-xl py-2 pr-9 pl-3 text-xs text-earth-900 outline-none focus:border-terracotta-500 focus:ring-2 focus:ring-terracotta-100 transition placeholder:text-earth-400" />
          </div>
          <div className="text-[10px] text-earth-500 font-mono">{countLabel(filtered.length)}</div>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">{[1, 2, 3].map((i) => (<div key={i} className="h-14 rounded-sm bg-earth-200 animate-pulse" />))}</div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-sm bg-earth-100 border-2 border-earth-200 flex items-center justify-center">
              <FileText className="w-6 h-6 text-earth-400" />
            </div>
            <p className="text-sm font-black text-earth-700">لا توجد فواتير</p>
            <p className="text-[10px] text-earth-500 mt-1 max-w-xs mx-auto">ابدأ بتسجيل أول فاتورة أو رحّل البضاعة من الحاسبة</p>
          </div>
        ) : (
          <div className="divide-y divide-earth-100">
            <AnimatePresence mode="popLayout">
              {filtered.map((inv, idx) => {
                const status = statusConfig[inv.status || "draft"] || statusConfig.draft;
                return (
                  <motion.div key={inv.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}
                    className="px-5 py-3.5 hover:bg-earth-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="shrink-0 w-8 text-center">
                        <div className="text-[9px] font-mono text-earth-500">{String(idx + 1).padStart(2, "0")}</div>
                        <div className="w-full h-px bg-earth-200 mt-0.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <User className="w-3 h-3 text-earth-400 shrink-0" />
                          <span className="text-sm font-black text-earth-900 truncate">{inv.client}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {inv.project && (<span className="flex items-center gap-1 text-[10px] text-earth-500 truncate"><Hash className="w-2.5 h-2.5 text-earth-400 shrink-0" />{inv.project}</span>)}
                          {inv.items && inv.items.length > 0 && (<span className="flex items-center gap-1 text-[10px] text-olive-600 font-bold"><Package className="w-2.5 h-2.5" />{inv.items.length} بند</span>)}
                        </div>
                      </div>
                      <div className="shrink-0 text-left" dir="ltr">
                        <div className="flex items-center gap-1.5">
                          <DollarSign className="w-3 h-3 text-earth-400" />
                          <span className="text-sm font-black font-mono text-earth-900">{invoiceTotal(inv)}</span>
                        </div>
                        <span className="text-[9px] text-earth-500 font-mono">JOD</span>
                      </div>
                      <button onClick={() => statusMutation.mutate({ id: inv.id, status: status.next })}
                        className={`shrink-0 text-[9px] font-bold px-2.5 py-1 rounded-[3px] border cursor-pointer transition ${status.color}`}
                        title={`تغيير الحالة إلى ${statusConfig[status.next].label}`}>
                        {status.label}
                      </button>
                      <div className="shrink-0 flex items-center gap-1">
                        <button onClick={() => openEdit(inv)} className="p-1.5 text-earth-500 hover:text-olive-600 transition cursor-pointer rounded-sm" title="تعديل"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => openWhatsApp(inv.phone, invoiceText(inv))} className="p-1.5 text-earth-500 hover:text-green-600 transition cursor-pointer rounded-sm" title="إرسال واتساب"><MessageCircle className="w-3.5 h-3.5" /></button>
                        <button onClick={() => printInvoice(inv)} className="p-1.5 text-earth-500 hover:text-olive-600 transition cursor-pointer rounded-sm" title="تحميل الفاتورة"><Download className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDelete(inv.id)} className="p-1.5 text-earth-500 hover:text-red-500 transition cursor-pointer rounded-sm" title="حذف الفاتورة"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ========== CREATE / EDIT MODAL ========== */}
      <AnimatePresence>
        {modal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={closeModal}>
            <motion.div initial={{ opacity: 0, scale: 0.96, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 10 }} transition={{ duration: 0.2, ease: "easeOut" }}
              className="bg-white border border-earth-200 rounded-sm p-5 max-w-md w-full max-h-[88vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-black text-earth-900 flex items-center gap-2">
                  <Receipt className="w-4 h-4" style={{ color: "var(--accent-terracotta)" }} />
                  {editId ? "تعديل الفاتورة" : "فاتورة جديدة"}
                </h3>
                <button onClick={closeModal} className="text-earth-500 hover:text-earth-700 transition p-1 cursor-pointer rounded-sm" aria-label="إغلاق"><X className="w-4 h-4" /></button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-black text-earth-700">العميل</label>
                    <input ref={clientInputRef} value={form.client}
                      onChange={(e) => { setForm((p) => ({ ...p, client: e.target.value })); setClientError(false); }}
                      placeholder="اسم العميل"
                      className={`w-full bg-white border-2 rounded-xl py-2.5 px-4 text-sm text-earth-900 outline-none transition placeholder:text-earth-400 ${clientError ? "border-red-300 focus:border-red-400" : "border-earth-200 focus:border-terracotta-500 focus:ring-2 focus:ring-terracotta-100"}`} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-black text-earth-700">المشروع</label>
                    <input value={form.project} onChange={(e) => setForm((p) => ({ ...p, project: e.target.value }))} placeholder="اختياري"
                      className="w-full bg-white border-2 border-earth-200 rounded-xl py-2.5 px-4 text-sm text-earth-900 outline-none focus:border-terracotta-500 focus:ring-2 focus:ring-terracotta-100 transition placeholder:text-earth-400" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-earth-700">هاتف العميل</label>
                  <input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} placeholder="اختياري — لإرسال الفاتورة واتساب" dir="ltr"
                    className="w-full bg-white border-2 border-earth-200 rounded-xl py-2.5 px-4 text-sm text-earth-900 outline-none focus:border-terracotta-500 focus:ring-2 focus:ring-terracotta-100 transition placeholder:text-earth-400" />
                </div>

                {/* Line items */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-black text-earth-700">البنود / البضاعة</label>
                    <button onClick={addItem} className="text-xs font-black text-olive-700 bg-olive-50 hover:bg-olive-100 py-1 px-2 rounded-sm border border-olive-200 transition flex items-center gap-1"><Plus className="w-3 h-3" /> بند</button>
                  </div>
                  {form.items.length === 0 ? (
                    <p className="text-[11px] text-earth-400">لا توجد بنود — أضف بنوداً أو أدخل المبلغ يدوياً بالأسفل.</p>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="grid grid-cols-12 gap-1 text-[9px] font-black text-earth-400 px-1">
                        <span className="col-span-5">الصنف</span><span className="col-span-2 text-center">الكمية</span><span className="col-span-2 text-center">الوحدة</span><span className="col-span-2 text-center">السعر</span><span className="col-span-1" />
                      </div>
                      {form.items.map((it, i) => (
                        <div key={i} className="grid grid-cols-12 gap-1 items-center">
                          <input value={it.name} onChange={(e) => updateItem(i, { name: e.target.value })} placeholder="الصنف"
                            className="col-span-5 bg-white border-2 border-earth-200 rounded-sm py-1.5 px-2 text-xs outline-none focus:border-olive-400" />
                          <input type="number" value={it.qty || ""} onChange={(e) => updateItem(i, { qty: +e.target.value })}
                            className="col-span-2 bg-white border-2 border-earth-200 rounded-sm py-1.5 px-1 text-xs text-center outline-none focus:border-olive-400 font-mono" />
                          <input value={it.unit} onChange={(e) => updateItem(i, { unit: e.target.value })}
                            className="col-span-2 bg-white border-2 border-earth-200 rounded-sm py-1.5 px-1 text-xs text-center outline-none focus:border-olive-400" />
                          <input type="number" value={it.price || ""} onChange={(e) => updateItem(i, { price: +e.target.value })}
                            className="col-span-2 bg-white border-2 border-earth-200 rounded-sm py-1.5 px-1 text-xs text-center outline-none focus:border-olive-400 font-mono" />
                          <button onClick={() => removeItem(i)} className="col-span-1 text-earth-400 hover:text-red-500 flex justify-center"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {form.items.length === 0 && (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-black text-earth-700">المبلغ (د.أ)</label>
                    <input type="number" value={form.amount || ""} onChange={(e) => setForm((p) => ({ ...p, amount: +e.target.value }))} placeholder="٠"
                      className="w-full bg-white border-2 border-earth-200 rounded-xl py-2.5 px-4 text-sm text-earth-900 font-mono font-black outline-none focus:border-terracotta-500 focus:ring-2 focus:ring-terracotta-100 transition placeholder:text-earth-400" />
                  </div>
                )}

                <div className="flex items-center justify-between bg-earth-50 rounded-sm px-3 py-2">
                  <span className="text-xs font-black text-earth-600">الإجمالي</span>
                  <span className="text-lg font-black font-mono text-olive-700">{formTotal} <span className="text-[10px]">د.أ</span></span>
                </div>

                <button onClick={handleSave} disabled={saveMutation.isPending}
                  className="w-full bg-olive-700 hover:bg-olive-800 active:bg-olive-900 text-white font-bold py-2.5 rounded-sm transition text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:pointer-events-none border-r-3 border-olive-900">
                  {saveMutation.isPending ? "جارٍ الحفظ..." : <><Check className="w-4 h-4" /> {editId ? "حفظ التعديلات" : "إنشاء الفاتورة"}</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
