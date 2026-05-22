import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { fetchInvoices, INVOICE_STATUS_LABELS, INVOICE_STATUS_COLORS } from "../services/invoiceService";

export default function InvoicesPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    fetchInvoices(user.uid).then(setAll).finally(() => setLoading(false));
  }, [user]);

  const filtered = filter === "all" ? all : all.filter((inv) => inv.status === filter);

  const totals = all.reduce((s, inv) => s + (inv.total || 0), 0);
  const paid = all.reduce((s, inv) => s + (inv.paidAmount || 0), 0);
  const unpaid = all.filter((inv) => inv.status === "unpaid" || inv.status === "partial").reduce((s, inv) => s + ((inv.total || 0) - (inv.paidAmount || 0)), 0);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-black text-ink flex items-center gap-3">
            <i className="fa-solid fa-file-invoice text-brand-600"></i> الفواتير
          </h1>
          <p className="text-sm text-ink-muted">إدارة الفواتير والمدفوعات</p>
        </div>
        <button onClick={() => navigate("/invoices/new")}
          className="bg-brand-600 hover:bg-brand-700 text-white font-bold py-2.5 px-5 rounded-xl text-sm transition flex items-center gap-2 shadow-lg">
          <i className="fa-solid fa-plus"></i> فاتورة جديدة
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="bg-surface border border-line rounded-2xl p-4 text-center shadow-sm">
          <p className="text-[10px] font-bold text-ink-muted">إجمالي الفواتير</p>
          <p className="text-xl font-black text-ink mt-1">{all.length}</p>
          <p className="text-[10px] text-ink-muted">{totals.toFixed(1)} د.أ</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
          <p className="text-[10px] font-bold text-emerald-700">مدفوع</p>
          <p className="text-xl font-black text-emerald-700 mt-1">{paid.toFixed(1)}</p>
          <p className="text-[10px] text-emerald-600">د.أ</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
          <p className="text-[10px] font-bold text-red-700">غير مدفوع</p>
          <p className="text-xl font-black text-red-700 mt-1">{unpaid.toFixed(1)}</p>
          <p className="text-[10px] text-red-600">د.أ</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
          <p className="text-[10px] font-bold text-amber-700">غير مدفوعة</p>
          <p className="text-xl font-black text-amber-700 mt-1">{all.filter((inv) => inv.status !== "paid" && inv.status !== "cancelled").length}</p>
          <p className="text-[10px] text-amber-600">فاتورة</p>
        </div>
      </div>

      <div className="flex gap-1.5 mb-4 overflow-x-auto">
        {[{ key: "all", label: "الكل" }, ...Object.entries(INVOICE_STATUS_LABELS).map(([k, v]) => ({ key: k, label: v }))].map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${filter === f.key ? "bg-brand-600 text-white shadow-md" : "bg-surface border border-line text-ink-muted hover:text-ink"}`}>
            {f.label} ({f.key === "all" ? all.length : all.filter((i) => i.status === f.key).length})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand-500"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-surface border border-line rounded-3xl p-12 text-center shadow-sm">
          <i className="fa-solid fa-file-invoice text-4xl text-ink-muted mb-3"></i>
          <p className="text-ink-muted font-bold">لا توجد فواتير</p>
          <button onClick={() => navigate("/invoices/new")}
            className="mt-3 bg-brand-600 hover:bg-brand-700 text-white font-bold py-2 px-5 rounded-xl text-sm transition">
            إنشاء أول فاتورة
          </button>
        </div>
      ) : (
        <div className="bg-surface border border-line rounded-3xl overflow-hidden shadow-sm">
          <table className="w-full text-right text-sm">
            <thead>
              <tr className="border-b border-line text-ink-muted text-[10px]">
                <th className="p-3 font-bold">رقم الفاتورة</th>
                <th className="p-3 font-bold">العميل</th>
                <th className="p-3 font-bold">التاريخ</th>
                <th className="p-3 font-bold">الإجمالي</th>
                <th className="p-3 font-bold">المدفوع</th>
                <th className="p-3 font-bold">الحالة</th>
                <th className="p-3 font-bold"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => (
                <tr key={inv.id} className="border-b border-line hover:bg-surface-subtle transition cursor-pointer" onClick={() => navigate(`/invoices/${inv.id}`)}>
                  <td className="p-3 font-bold text-ink">{inv.invoiceNumber}</td>
                  <td className="p-3 text-ink-muted">{inv.client?.name || "-"}</td>
                  <td className="p-3 text-ink-muted">{inv.date ? new Date(inv.date).toLocaleDateString("ar-JO") : "-"}</td>
                  <td className="p-3 font-bold text-ink">{(inv.total || 0).toFixed(1)}</td>
                  <td className="p-3 text-ink-muted">{(inv.paidAmount || 0).toFixed(1)}</td>
                  <td className="p-3">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border ${INVOICE_STATUS_COLORS[inv.status] || ""}`}>
                      {INVOICE_STATUS_LABELS[inv.status] || inv.status}
                    </span>
                  </td>
                  <td className="p-3">
                    <i className="fa-solid fa-chevron-left text-ink-muted"></i>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
