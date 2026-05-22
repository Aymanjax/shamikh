import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { fetchInvoice, deleteInvoice, addInvoicePayment, deleteInvoicePayment, INVOICE_STATUS_LABELS, INVOICE_STATUS_COLORS } from "../services/invoiceService";
import { downloadInvoice } from "../services/pdfService";

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [payModal, setPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payNote, setPayNote] = useState("");

  useEffect(() => {
    if (!user || !id) return;
    setLoading(true);
    fetchInvoice(user.uid, id).then((data) => {
      setInvoice(data);
      setLoading(false);
    });
  }, [user, id]);

  const reload = () => {
    if (!user || !id) return;
    fetchInvoice(user.uid, id).then(setInvoice);
  };

  const handleAddPayment = async () => {
    const amount = parseFloat(payAmount);
    if (!amount || amount <= 0) return;
    await addInvoicePayment(user.uid, id, { amount, note: payNote });
    setPayModal(false);
    setPayAmount("");
    setPayNote("");
    reload();
  };

  const handleDeletePayment = async (paymentId) => {
    if (!confirm("حذف الدفعة؟")) return;
    await deleteInvoicePayment(user.uid, id, paymentId);
    reload();
  };

  const handleDelete = async () => {
    if (!confirm("حذف الفاتورة نهائياً؟")) return;
    await deleteInvoice(user.uid, id);
    navigate("/invoices");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="max-w-3xl mx-auto text-center py-20">
        <i className="fa-solid fa-circle-exclamation text-4xl text-red-400 mb-3"></i>
        <p className="text-ink-muted font-bold">الفاتورة غير موجودة</p>
        <Link to="/invoices" className="mt-3 inline-block text-brand-600 font-bold text-sm">العودة للفواتير</Link>
      </div>
    );
  }

  const inv = invoice;
  const remaining = (inv.total || 0) - (inv.paidAmount || 0);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link to="/invoices" className="text-sm text-ink-muted hover:text-ink transition flex items-center gap-1 mb-2">
          <i className="fa-solid fa-arrow-right"></i> العودة للفواتير
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-black text-ink">{inv.invoiceNumber}</h1>
              <span className={`text-xs font-bold px-3 py-1 rounded-lg border ${INVOICE_STATUS_COLORS[inv.status] || ""}`}>
                {INVOICE_STATUS_LABELS[inv.status] || inv.status}
              </span>
            </div>
            <p className="text-sm text-ink-muted">{inv.client?.name || "-"}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => downloadInvoice(inv)}
              className="bg-surface-subtle hover:bg-surface-input text-ink font-bold py-2 px-4 rounded-xl transition text-sm border border-line flex items-center gap-1.5">
              <i className="fa-solid fa-file-pdf text-red-500"></i> PDF
            </button>
            {inv.status !== "paid" && inv.status !== "cancelled" && (
              <button onClick={() => setPayModal(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-xl transition text-sm flex items-center gap-1.5">
                <i className="fa-solid fa-plus"></i> إضافة دفعة
              </button>
            )}
            <button onClick={handleDelete}
              className="bg-red-50 hover:bg-red-100 text-red-600 font-bold py-2 px-4 rounded-xl transition text-sm border border-red-200 flex items-center gap-1.5">
              <i className="fa-solid fa-trash-can"></i> حذف
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="bg-surface border border-line rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] font-bold text-ink-muted">إجمالي الفاتورة</p>
          <p className="text-lg font-black text-ink mt-1">{(inv.total || 0).toFixed(1)}</p>
          <p className="text-[10px] text-ink-muted">د.أ</p>
        </div>
        <div className={`rounded-2xl p-4 ${inv.paidAmount > 0 ? "bg-emerald-50 border border-emerald-200" : "bg-surface border border-line"}`}>
          <p className="text-[10px] font-bold text-ink-muted">المدفوع</p>
          <p className="text-lg font-black text-emerald-700 mt-1">{(inv.paidAmount || 0).toFixed(1)}</p>
          <p className="text-[10px] text-emerald-600">د.أ</p>
        </div>
        <div className={`rounded-2xl p-4 ${remaining > 0 ? "bg-red-50 border border-red-200" : "bg-emerald-50 border border-emerald-200"}`}>
          <p className="text-[10px] font-bold text-ink-muted">{remaining > 0 ? "المتبقي" : "مسدد"}</p>
          <p className={`text-lg font-black mt-1 ${remaining > 0 ? "text-red-600" : "text-emerald-700"}`}>{remaining > 0 ? remaining.toFixed(1) : "✓"}</p>
          <p className="text-[10px]" style={{ color: remaining > 0 ? "#dc2626" : "#16a34a" }}>د.أ</p>
        </div>
        <div className="bg-surface border border-line rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] font-bold text-ink-muted">التاريخ</p>
          <p className="text-sm font-black text-ink mt-1">{inv.date ? new Date(inv.date).toLocaleDateString("ar-JO") : "-"}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-surface border border-line rounded-2xl p-5 shadow-sm">
          <h3 className="font-bold text-sm text-ink mb-2 flex items-center gap-2"><i className="fa-solid fa-user text-brand-600"></i> العميل</h3>
          <p className="font-bold text-ink">{inv.client?.name || "-"}</p>
          <p className="text-xs text-ink-muted">{inv.client?.phone || ""}</p>
          <p className="text-xs text-ink-muted">{inv.client?.address || ""}</p>
        </div>
        <div className="bg-surface border border-line rounded-2xl p-5 shadow-sm">
          <h3 className="font-bold text-sm text-ink mb-2 flex items-center gap-2"><i className="fa-solid fa-building text-amber-600"></i> الشركة</h3>
          <p className="font-bold text-ink">{inv.companyName || "شموخ ERP"}</p>
          <p className="text-xs text-ink-muted">تاريخ الاستحقاق: {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString("ar-JO") : "-"}</p>
          {inv.projectId && (
            <Link to={`/projects/${inv.projectId}`} className="text-xs text-brand-600 font-bold hover:text-brand-700 mt-1 inline-block">
              <i className="fa-solid fa-arrow-left ml-1"></i> عرض المشروع
            </Link>
          )}
        </div>
      </div>

      <div className="bg-surface border border-line rounded-2xl overflow-hidden shadow-sm mb-6">
        <table className="w-full text-right text-sm">
          <thead>
            <tr className="border-b border-line text-ink-muted text-[10px] bg-surface-subtle">
              <th className="p-3 font-bold">#</th>
              <th className="p-3 font-bold">الصنف</th>
              <th className="p-3 font-bold">الوحدة</th>
              <th className="p-3 font-bold">الكمية</th>
              <th className="p-3 font-bold">سعر الوحدة</th>
              <th className="p-3 font-bold">الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            {(inv.items || []).map((item, idx) => (
              <tr key={idx} className="border-b border-line hover:bg-surface-subtle">
                <td className="p-3 text-ink-muted text-[10px]">{idx + 1}</td>
                <td className="p-3 font-bold text-ink">{item.name}</td>
                <td className="p-3 text-ink-muted text-xs">{item.unit || ""}</td>
                <td className="p-3 text-ink">{item.qty}</td>
                <td className="p-3 text-ink">{(item.unitPrice || 0).toFixed(2)}</td>
                <td className="p-3 font-bold text-ink">{(item.total || 0).toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="bg-amber-50 p-4 flex justify-between items-center border-t border-amber-200">
          <span className="font-bold text-amber-800">الإجمالي</span>
          <span className="font-black text-amber-700 text-xl">{(inv.total || 0).toFixed(1)} د.أ</span>
        </div>
      </div>

      {(inv.payments || []).length > 0 && (
        <div className="bg-surface border border-line rounded-2xl p-5 shadow-sm mb-6">
          <h3 className="font-bold text-sm text-ink mb-3 flex items-center gap-2"><i className="fa-solid fa-credit-card text-emerald-600"></i> المدفوعات</h3>
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-bold text-ink-muted px-2 pb-1 border-b border-line">
              <span>التاريخ</span>
              <span>البيان</span>
              <span>المبلغ</span>
              <span></span>
            </div>
            {(inv.payments || []).map((p) => (
              <div key={p.id} className="flex justify-between items-center py-2 px-2 hover:bg-surface-subtle rounded-xl text-sm">
                <span className="text-xs text-ink-muted">{new Date(p.date).toLocaleDateString("ar-JO")}</span>
                <span className="text-ink-muted text-xs">{p.note || "دفعة"}</span>
                <span className="font-bold text-emerald-700">{p.amount.toFixed(2)} د.أ</span>
                <button onClick={() => handleDeletePayment(p.id)} className="text-red-400 hover:text-red-600 text-xs"><i className="fa-solid fa-trash-can"></i></button>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center pt-2 mt-2 border-t border-line px-2">
            <span className="font-bold text-ink-muted">المجموع</span>
            <span className="font-black text-ink">{(inv.paidAmount || 0).toFixed(2)} د.أ</span>
          </div>
        </div>
      )}

      {inv.notes && (
        <div className="bg-surface border border-line rounded-2xl p-5 shadow-sm mb-6">
          <h3 className="font-bold text-sm text-ink mb-2 flex items-center gap-2"><i className="fa-solid fa-note-sticky text-slate-500"></i> ملاحظات</h3>
          <p className="text-sm text-ink-muted">{inv.notes}</p>
        </div>
      )}

      {payModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setPayModal(false)}>
          <div className="bg-surface border border-line rounded-3xl p-6 max-w-sm w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-lg text-ink mb-2">إضافة دفعة</h3>
            <p className="text-xs text-ink-muted mb-4">المتبقي: {(inv.total - (inv.paidAmount || 0)).toFixed(1)} د.أ</p>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-ink-muted">المبلغ</label>
                <input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} min="0" step="1" autoFocus
                  className="w-full bg-surface-input border border-line rounded-xl py-2.5 px-4 text-ink outline-none text-sm focus:border-emerald-500 transition" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-ink-muted">البيان (اختياري)</label>
                <input value={payNote} onChange={(e) => setPayNote(e.target.value)}
                  className="w-full bg-surface-input border border-line rounded-xl py-2.5 px-4 text-ink outline-none text-sm focus:border-emerald-500 transition" />
              </div>
              <button onClick={handleAddPayment}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl transition text-sm">
                <i className="fa-solid fa-check ml-1"></i> تأكيد الدفعة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
