import { useState, useRef, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Plus, Search, Download, Trash2, X, Check, Receipt, User, Hash, MessageCircle, Pencil, Percent } from "lucide-react";
import { listDocumentsByUser, addDocument, deleteDocument, updateDocument } from "../../lib/firestoreService";
import { useAuthStore } from "../../store/authStore";
import { printInvoice } from "../../lib/printInvoice";
import { openWhatsApp } from "../../lib/whatsapp";
import GlassButton from "../../components/ui/GlassButton";


  desc: string;
  qty: number;
  price: number;
}

interface Invoice {
  id: string;
  client?: string;
  project?: string;
  phone?: string;
  amount?: number;
  subtotal?: number;
  items?: LineItem[];
  status?: string;
  projectId?: string;
  items?: InvoiceItem[];
  discount?: number;
  taxRate?: number;
  notes?: string;
  createdAt?: unknown;
}

interface InvoiceForm {
  client: string;
  project: string;
  phone: string;
  status: string;

// حساب مجاميع الفاتورة: بنود → فرعي → خصم → ضريبة → إجمالي
function computeTotals(items: InvoiceItem[], discount: number, taxRate: number) {
  const subtotal = items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.price) || 0), 0);
  const afterDiscount = Math.max(0, subtotal - (Number(discount) || 0));
  const tax = +(afterDiscount * ((Number(taxRate) || 0) / 100)).toFixed(2);
  const total = +(afterDiscount + tax).toFixed(2);
  return { subtotal, tax, total };
}

/** رسالة واتساب — عرض سعر للمسودات، فاتورة لغير ذلك. */
function invoiceText(inv: Invoice, companyName: string): string {
  const head = inv.status === "draft" ? "عرض سعر" : "فاتورة";
  const lines = [
    `${head} — ${companyName || "شموخ"}`,
    `العميل: ${inv.client || ""}`,
    inv.project ? `المشروع: ${inv.project}` : "",
  ];
  if (inv.items && inv.items.length > 0) {
    lines.push("———");
    inv.items.forEach((it) => lines.push(`• ${it.desc}: ${it.qty} × ${it.price} = ${(it.qty * it.price).toFixed(2)} د.أ`));
    lines.push("———");
  }
  lines.push(`الإجمالي: ${inv.amount ?? 0} د.أ`);
  return lines.filter(Boolean).join("\n");
}

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

export default function InvoicesPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const companyName = useAuthStore((s) => s.companyName);
  const companyProfile = useAuthStore((s) => s.companyProfile);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<InvoiceForm>(defaultForm());
  const [clientError, setClientError] = useState(false);
  const clientInputRef = useRef<HTMLInputElement>(null);

  const company = useMemo(() => ({
    name: companyName,
    logoURL: companyProfile?.logoURL,
    phone: companyProfile?.phone,
    address: companyProfile?.address,
  }), [companyName, companyProfile]);

  const totals = useMemo(
    () => computeTotals(form.items, form.discount, form.taxRate),
    [form.items, form.discount, form.taxRate]
  );

  const { data: invoices = [], isLoading: loading, error } = useQuery<Invoice[]>({
    queryKey: ["invoices", user?.uid],
    queryFn: () => listDocumentsByUser("invoices", user!.uid) as Promise<Invoice[]>,
    staleTime: 30_000,
    enabled: !!user,
  });


    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteDocument("invoices", id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["invoices"] }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateDocument("invoices", id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["invoices"] }),
  });

  const handleSave = useCallback(() => {
    if (!form.client.trim()) {
      setClientError(true);
      clientInputRef.current?.focus();
      return;
    }


  const updateItem = useCallback((idx: number, patch: Partial<LineItem>) => {
    setForm((p) => ({ ...p, items: p.items.map((it, i) => (i === idx ? { ...it, ...patch } : it)) }));
  }, []);
  const addItem = useCallback(() => setForm((p) => ({ ...p, items: [...p.items, emptyItem()] })), []);
  const removeItem = useCallback((idx: number) => {
    setForm((p) => ({ ...p, items: p.items.length > 1 ? p.items.filter((_, i) => i !== idx) : p.items }));
  }, []);

  const formSubtotal = sumItems(form.items);

  const handleDelete = useCallback((id: string) => {
    if (!confirm("حذف هذه الفاتورة؟ لا يمكن التراجع عن الحذف.")) return;
    deleteMutation.mutate(id);
  }, [deleteMutation]);

  const handleStatusToggle = useCallback((inv: Invoice) => {
    const next = inv.status === "draft" ? "pending" : inv.status === "pending" ? "paid" : "draft";
    statusMutation.mutate({ id: inv.id, status: next });
  }, [statusMutation]);

  const setItem = (i: number, patch: Partial<InvoiceItem>) =>
    setForm((p) => ({ ...p, items: p.items.map((it, j) => (j === i ? { ...it, ...patch } : it)) }));
  const addItem = () => setForm((p) => ({ ...p, items: [...p.items, emptyItem()] }));
  const removeItem = (i: number) =>
    setForm((p) => ({ ...p, items: p.items.length > 1 ? p.items.filter((_, j) => j !== i) : p.items }));

  const filtered = invoices.filter((inv) =>
    !search || inv.client?.includes(search) || inv.project?.includes(search)
  );

  if (error) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm font-black text-earth-800 mb-1">تعذر تحميل الفواتير</p>
        <p className="text-xs text-earth-500">تحقق من اتصالك بالإنترنت وحاول مرة أخرى</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {/* Page header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-sm bg-olive-600 flex items-center justify-center border-l-3 border-olive-400">
            <Receipt className="w-6 h-6 text-paper" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-earth-900 tracking-tight">الفواتير</h1>
            <p className="text-xs text-earth-500 mt-0.5">إدارة الفواتير وعروض الأسعار</p>
          </div>
        </div>
        <GlassButton variant="primary" size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setModal(true)}>
          فاتورة جديدة
        </GlassButton>
      </div>

      {/* Document card */}
      <div className="glass-card overflow-hidden">
        {/* Search bar */}
        <div className="px-5 py-3.5 border-b border-earth-200 flex items-center justify-between">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-earth-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث باسم العميل أو المشروع"
              className="w-full bg-white border-2 border-earth-200 rounded-xl py-2 pr-9 pl-3 text-xs text-earth-900 outline-none focus:border-terracotta-500 focus:ring-2 focus:ring-terracotta-100 transition placeholder:text-earth-400"
            />
          </div>
          <div className="text-[10px] text-earth-500 font-mono">
            {countLabel(filtered.length)}
          </div>
        </div>

        {/* Document body */}
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 rounded-sm bg-earth-200 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-sm bg-earth-100 border-2 border-earth-200 flex items-center justify-center">
              <FileText className="w-6 h-6 text-earth-400" />
            </div>
            <p className="text-sm font-black text-earth-700">لا توجد فواتير</p>
            <p className="text-[10px] text-earth-500 mt-1 max-w-xs mx-auto">
              ابدأ بتسجيل أول فاتورة لتتبع مدفوعات مشاريعك
            </p>
          </div>
        ) : (
          <div className="divide-y divide-earth-100">
            <AnimatePresence mode="popLayout">
              {filtered.map((inv, idx) => {
                const status = statusConfig[inv.status || "draft"] || statusConfig.draft;
                return (
                  <motion.div
                    key={inv.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="px-5 py-3.5 hover:bg-earth-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {/* Invoice number */}
                      <div className="shrink-0 w-8 text-center">
                        <div className="text-[9px] font-mono text-earth-500">{String(idx + 1).padStart(2, "0")}</div>
                        <div className="w-full h-px bg-earth-200 mt-0.5" />
                      </div>

                      {/* Client & Project */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <User className="w-3 h-3 text-earth-400 shrink-0" />
                          <span className="text-sm font-black text-earth-900 truncate">{inv.client}</span>
                          {inv.items && inv.items.length > 0 && (
                            <span className="text-[9px] font-mono text-earth-500 bg-earth-100 border border-earth-200 rounded-sm px-1.5 py-0.5 shrink-0">
                              {inv.items.length} بند
                            </span>
                          )}
                        </div>
                        {inv.project && (
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Hash className="w-2.5 h-2.5 text-earth-400 shrink-0" />
                            <span className="text-[10px] text-earth-500 truncate">{inv.project}</span>
                          </div>
                        )}
                        {inv.items && inv.items.length > 0 && (
                          <span className="text-[9px] text-earth-400 mt-0.5 block">{inv.items.length} بند</span>
                        )}
                      </div>

                      {/* Amount */}
                      <div className="shrink-0 text-left" dir="ltr">
                        <span className="text-sm font-black font-mono text-earth-900">
                          {inv.amount}
                        </span>
                        <span className="text-[9px] text-earth-500 font-mono block">JOD</span>
                      </div>

                      {/* Status */}
                      <button
                        onClick={() => handleStatusToggle(inv)}
                        className={`shrink-0 text-[9px] font-bold px-2.5 py-1 rounded-[3px] border cursor-pointer transition ${status.color}`}
                        title={`تغيير الحالة إلى ${statusConfig[status.next].label}`}
                      >
                        {status.label}
                      </button>

                      {/* Actions */}
                      <div className="shrink-0 flex items-center gap-1">
                        <button
                          onClick={() => handleEdit(inv)}
                          className="p-1.5 text-earth-500 hover:text-terracotta-500 transition cursor-pointer rounded-sm"
                          title="تعديل الفاتورة"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openWhatsApp(inv.phone, invoiceText(inv, companyName))}
                          className="p-1.5 text-earth-500 hover:text-green-600 transition cursor-pointer rounded-sm"
                          title="إرسال واتساب"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => printInvoice(inv, company)}
                          className="p-1.5 text-earth-500 hover:text-olive-600 transition cursor-pointer rounded-sm"
                          title="طباعة الفاتورة"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(inv.id)}
                          className="p-1.5 text-earth-500 hover:text-red-500 transition cursor-pointer rounded-sm"
                          title="حذف الفاتورة"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="bg-white border border-earth-200 rounded-sm p-5 max-w-2xl w-full max-h-[92vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-black text-earth-900 flex items-center gap-2">
                  <Receipt className="w-4 h-4" style={{ color: "var(--accent-terracotta)" }} />
                  {editId ? "تعديل الفاتورة" : "فاتورة جديدة"}
                </h3>
                <button
                  onClick={closeModal}
                  className="text-earth-500 hover:text-earth-700 transition p-1 cursor-pointer rounded-sm"
                  aria-label="إغلاق"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                {/* بيانات العميل */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label htmlFor="invoice-client" className="block text-xs font-black text-earth-700">
                      العميل <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="invoice-client"
                      ref={clientInputRef}
                      value={form.client}
                      onChange={(e) => { setForm((p) => ({ ...p, client: e.target.value })); setClientError(false); }}
                      placeholder="اسم العميل"
                      className={`w-full bg-white border-2 rounded-xl py-2 px-3 text-sm text-earth-900 outline-none transition placeholder:text-earth-400 ${
                        clientError
                          ? "border-red-300 focus:border-red-400"
                          : "border-earth-200 focus:border-terracotta-500"
                      }`}
                    />
                    {clientError && <p className="text-[11px] text-red-500 font-medium">اسم العميل مطلوب</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="invoice-project" className="block text-xs font-black text-earth-700">المشروع</label>
                    <input
                      id="invoice-project"
                      value={form.project}
                      onChange={(e) => setForm((p) => ({ ...p, project: e.target.value }))}
                      placeholder="اختياري"
                      className="w-full bg-white border-2 border-earth-200 rounded-xl py-2 px-3 text-sm text-earth-900 outline-none focus:border-terracotta-500 transition placeholder:text-earth-400"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="invoice-phone" className="block text-xs font-black text-earth-700">هاتف العميل</label>
                    <input
                      id="invoice-phone"
                      value={form.phone}
                      onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                      placeholder="للواتساب" dir="ltr"
                      className="w-full bg-white border-2 border-earth-200 rounded-xl py-2 px-3 text-sm text-earth-900 outline-none focus:border-terracotta-500 transition placeholder:text-earth-400"
                    />
                  </div>
                </div>

                {/* البنود */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-black text-earth-700">البنود</label>
                    <span className="text-[10px] text-earth-500 font-mono">وصف × كمية × سعر</span>
                  </div>
                  <div className="border-2 border-earth-200 rounded-xl overflow-hidden">
                    <div className="grid grid-cols-12 gap-px bg-earth-200 text-[10px] font-black text-earth-600">
                      <div className="col-span-6 bg-earth-100 px-3 py-1.5">البيان</div>
                      <div className="col-span-2 bg-earth-100 px-2 py-1.5 text-center">الكمية</div>
                      <div className="col-span-2 bg-earth-100 px-2 py-1.5 text-center">السعر</div>
                      <div className="col-span-2 bg-earth-100 px-2 py-1.5 text-center">المجموع</div>
                    </div>
                    {form.items.map((it, i) => (
                      <div key={i} className="grid grid-cols-12 gap-px bg-earth-100 border-t border-earth-100 group">
                        <input
                          value={it.desc}
                          onChange={(e) => setItem(i, { desc: e.target.value })}
                          placeholder={`بند ${i + 1} — مثال: قرميد PVC مع تركيب`}
                          className="col-span-6 bg-white px-3 py-2 text-xs text-earth-900 outline-none focus:bg-terracotta-50/30 placeholder:text-earth-300"
                        />
                        <input
                          type="number" min="0" step="0.5" value={it.qty || ""}
                          onChange={(e) => setItem(i, { qty: +e.target.value })}
                          placeholder="1"
                          className="col-span-2 bg-white px-2 py-2 text-xs font-mono text-center text-earth-900 outline-none focus:bg-terracotta-50/30"
                        />
                        <input
                          type="number" min="0" step="0.01" value={it.price || ""}
                          onChange={(e) => setItem(i, { price: +e.target.value })}
                          placeholder="0.00"
                          className="col-span-2 bg-white px-2 py-2 text-xs font-mono text-center text-earth-900 outline-none focus:bg-terracotta-50/30"
                        />
                        <div className="col-span-2 bg-white px-2 py-2 text-xs font-mono font-black text-center text-earth-700 relative">
                          {((it.qty || 0) * (it.price || 0)).toFixed(2)}
                          {form.items.length > 1 && (
                            <button
                              onClick={() => removeItem(i)}
                              className="absolute left-1 top-1/2 -translate-y-1/2 p-0.5 text-earth-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                              title="حذف البند"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={addItem}
                      className="w-full py-2 text-[11px] font-black text-terracotta-500 hover:bg-terracotta-50 transition flex items-center justify-center gap-1 border-t border-earth-100"
                    >
                      <Plus className="w-3.5 h-3.5" /> إضافة بند
                    </button>
                  </div>
                </div>

                {/* الخصم والضريبة والمجاميع */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label htmlFor="invoice-discount" className="block text-xs font-black text-earth-700">الخصم (د.أ)</label>
                      <input
                        id="invoice-discount"
                        type="number" min="0" step="0.01" value={form.discount || ""}
                        onChange={(e) => setForm((p) => ({ ...p, discount: +e.target.value }))}
                        placeholder="0"
                        className="w-full bg-white border-2 border-earth-200 rounded-xl py-2 px-3 text-sm font-mono text-earth-900 outline-none focus:border-terracotta-500 transition"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="invoice-tax" className="block text-xs font-black text-earth-700 flex items-center gap-1">
                        <Percent className="w-3 h-3" /> الضريبة % <span className="font-normal text-earth-400">(اختياري — اتركها 0 بلا ضريبة)</span>
                      </label>
                      <input
                        id="invoice-tax"
                        type="number" min="0" max="100" step="0.5" value={form.taxRate || ""}
                        onChange={(e) => setForm((p) => ({ ...p, taxRate: +e.target.value }))}
                        placeholder="0"
                        className="w-full bg-white border-2 border-earth-200 rounded-xl py-2 px-3 text-sm font-mono text-earth-900 outline-none focus:border-terracotta-500 transition"
                      />
                    </div>
                  </div>
                  <div className="bg-earth-50 border-2 border-earth-200 rounded-xl p-3 space-y-1.5 self-start">
                    <div className="flex justify-between text-xs text-earth-600">
                      <span>المجموع الفرعي</span>
                      <span className="font-mono">{totals.subtotal.toFixed(2)}</span>
                    </div>
                    {form.discount > 0 && (
                      <div className="flex justify-between text-xs text-earth-600">
                        <span>الخصم</span>
                        <span className="font-mono">− {form.discount.toFixed(2)}</span>
                      </div>
                    )}
                    {form.taxRate > 0 && (
                      <div className="flex justify-between text-xs text-earth-600">
                        <span>الضريبة ({form.taxRate}%)</span>
                        <span className="font-mono">{totals.tax.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-black text-earth-900 border-t-2 border-earth-200 pt-1.5">
                      <span>الإجمالي</span>
                      <span className="font-mono">{totals.total.toFixed(2)} د.أ</span>
                    </div>
                  </div>
                </div>

                </div>

                <div className="pt-1 flex gap-2">
                  <button
                    onClick={handleSave}
                    disabled={saveMutation.isPending}
                    className="flex-1 bg-olive-700 hover:bg-olive-800 active:bg-olive-900 text-earth-100 font-bold py-2.5 rounded-sm transition text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:pointer-events-none border-r-3 border-olive-900"
                  >
                    {saveMutation.isPending
                      ? "جارٍ الحفظ..."
                      : <><Check className="w-4 h-4" /> {editId ? "حفظ التعديلات" : "إنشاء الفاتورة"}</>}
                  </button>
                  <button
                    onClick={() => {
                      const { total } = computeTotals(form.items, form.discount, form.taxRate);
                      printInvoice({ ...form, id: editId || "", amount: total }, company);
                    }}
                    className="px-4 bg-white hover:bg-earth-50 text-earth-700 font-bold py-2.5 rounded-sm transition text-sm flex items-center justify-center gap-2 cursor-pointer border-2 border-earth-200"
                    title="معاينة الطباعة"
                  >
                    <Download className="w-4 h-4" /> معاينة
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
