// @ts-nocheck
import { useState, useEffect } from "react";
import { FileText, Search, RotateCw, Trash2, AlertCircle, Check, Clock, DollarSign } from "lucide-react";
import { useT, formatDate } from "../../i18n";
import { adminApi } from "./adminApiService";

// تسميات الحالات تُترجم وقت العرض — القيم المخزنة لا تتغير
const STATUS_LABEL_KEYS: Record<string, string> = {
  draft: "admin.status.draft", pending: "admin.status.pending", paid: "admin.status.paid",
};
const STATUS_COLORS: Record<string, string> = {
  draft: "text-slate-600 bg-slate-50 border-slate-200",
  pending: "text-amber-600 bg-amber-50 border-amber-200",
  paid: "text-emerald-600 bg-emerald-50 border-emerald-200",
};
const NEXT_STATUS: Record<string, string> = { draft: "pending", pending: "paid" };

export default function InvoicesTab() {
  const t = useT();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await adminApi.getInvoices();
      setInvoices(res.data || []);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleStatusChange = async (inv: any, newStatus: string) => {
    try {
      await adminApi.updateInvoiceStatus(inv.id, newStatus);
      setInvoices((prev) => prev.map((i) => (i.id === inv.id ? { ...i, status: newStatus } : i)));
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleDelete = async (inv: any) => {
    if (!window.confirm(t("admin.invoices.deleteConfirm", { name: inv.client }))) return;
    try {
      await adminApi.deleteInvoice(inv.id);
      setInvoices((prev) => prev.filter((i) => i.id !== inv.id));
    } catch (e: any) {
      setError(e.message);
    }
  };

  const totalPaid = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + (i.amount || 0), 0);
  const totalPending = invoices.filter((i) => i.status === "pending").reduce((s, i) => s + (i.amount || 0), 0);
  const totalDraft = invoices.filter((i) => i.status === "draft").reduce((s, i) => s + (i.amount || 0), 0);

  const filtered = invoices
    .filter((i) => (filter === "all" ? true : i.status === filter))
    .filter((i) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (i.client || "").toLowerCase().includes(q) ||
        (i.project || "").toLowerCase().includes(q) ||
        (i.userId || "").toLowerCase().includes(q);
    });

  const FILTERS = [
    { key: "all", label: t("common.all") },
    { key: "draft", label: t("admin.status.draft") },
    { key: "pending", label: t("admin.status.pending") },
    { key: "paid", label: t("admin.status.paid") },
  ];

  return (
    <div className="space-y-4">
      <div className="glass-card p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-ice-blue-600" />
            <span className="font-black text-ink-primary">{invoices.length}</span>
            <span className="text-sm text-ink-muted">{t("admin.invoices.countLabel")}</span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted" />
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder={t("admin.searchByClient")}
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl py-2 pr-9 pl-3 text-sm text-ink-primary outline-none focus:border-ice-blue-500 transition font-medium" />
            </div>
            <button onClick={load} className="text-ink-muted hover:text-ink-secondary p-2 hover:bg-slate-100 rounded-lg transition border-2 border-transparent hover:border-slate-200" title={t("admin.refresh")}>
              <RotateCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {FILTERS.map((f) => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`text-xs font-black px-3 py-1.5 rounded-lg transition border-2 ${
                filter === f.key ? "bg-ice-blue-600 text-paper border-ice-blue-600" : "bg-white text-ink-muted border-slate-200 hover:border-slate-300"
              }`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card p-3 text-center">
          <p className="text-xs text-ink-muted font-bold">{t("admin.status.paid")}</p>
          <p className="text-lg font-black text-emerald-600">{totalPaid.toFixed(0)} {t("common.currency")}</p>
        </div>
        <div className="glass-card p-3 text-center">
          <p className="text-xs text-ink-muted font-bold">{t("admin.invoices.due")}</p>
          <p className="text-lg font-black text-amber-600">{totalPending.toFixed(0)} {t("common.currency")}</p>
        </div>
        <div className="glass-card p-3 text-center">
          <p className="text-xs text-ink-muted font-bold">{t("admin.status.draft")}</p>
          <p className="text-lg font-black text-slate-600">{totalDraft.toFixed(0)} {t("common.currency")}</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-2 border-red-200 text-red-600 font-bold text-sm p-4 rounded-xl flex items-start gap-2">
          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-ink-muted">
          <div className="animate-spin w-6 h-6 border-2 border-ice-blue-500 border-t-transparent rounded-full mx-auto mb-2" />
          <p className="text-sm font-bold">{t("admin.loading")}</p>
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((inv) => (
            <div key={inv.id} className="glass-card p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black text-ink-primary truncate">{inv.client}</p>
                  {inv.project && <p className="text-xs text-ink-muted">{inv.project}</p>}
                </div>
                <span className={`text-xs font-black px-2 py-0.5 rounded-lg border-2 shrink-0 ${STATUS_COLORS[inv.status] || ""}`}>
                  {STATUS_LABEL_KEYS[inv.status] ? t(STATUS_LABEL_KEYS[inv.status]) : inv.status}
                </span>
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-lg font-black text-ink-primary">{inv.amount?.toFixed(0)} {t("common.currency")}</span>
                <span className="text-[10px] text-ink-muted">{formatDate(new Date(inv.createdAt))}</span>
              </div>
              <div className="flex items-center gap-1">
                {NEXT_STATUS[inv.status] && (
                  <button onClick={() => handleStatusChange(inv, NEXT_STATUS[inv.status])}
                    className="flex-1 text-xs font-black py-1.5 rounded-lg transition flex items-center justify-center gap-1 border-2 bg-amber-50 hover:bg-amber-100 text-amber-600 border-amber-200">
                    <Check className="w-3 h-3" />
                    {NEXT_STATUS[inv.status] === "pending" ? t("admin.invoices.markPending") : t("admin.invoices.markPaid")}
                  </button>
                )}
                <button onClick={() => handleDelete(inv)}
                  className="flex-1 text-xs font-black text-red-600 bg-red-50 hover:bg-red-100 py-1.5 rounded-lg transition flex items-center justify-center gap-1 border-2 border-red-200">
                  <Trash2 className="w-3 h-3" /> {t("common.delete")}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-ink-muted">
          <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm font-black">{t("admin.invoices.empty")}</p>
        </div>
      )}
    </div>
  );
}
