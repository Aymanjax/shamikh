// @ts-nocheck
import { useState, useEffect } from "react";
import { History, Search, RotateCw, AlertCircle, Shield } from "lucide-react";
import { adminApi } from "./adminApiService";

const ACTION_LABELS: Record<string, string> = {
  update_config: "تحديث الإعدادات",
  update_role: "تغيير صلاحية",
  toggle_ban: "تبديل حظر",
  set_subscription: "تعديل اشتراك",
};

const ACTION_COLORS: Record<string, string> = {
  update_config: "text-ice-blue-600 bg-ice-blue-50 border-ice-blue-200",
  update_role: "text-amber-600 bg-amber-50 border-amber-200",
  toggle_ban: "text-red-600 bg-red-50 border-red-200",
  set_subscription: "text-emerald-600 bg-emerald-50 border-emerald-200",
};

export default function AuditLogsTab() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await adminApi.getAuditLogs(100);
      setLogs(res.data || []);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = logs
    .filter((l) => (filter === "all" ? true : l.action === filter))
    .filter((l) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (l.details || "").toLowerCase().includes(q) ||
        (l.adminUid || "").toLowerCase().includes(q) ||
        (l.targetUid || "").toLowerCase().includes(q);
    });

  const FILTERS = [
    { key: "all", label: "الكل" },
    { key: "update_role", label: "تغيير صلاحية" },
    { key: "toggle_ban", label: "حظر/رفع" },
    { key: "set_subscription", label: "اشتراكات" },
    { key: "update_config", label: "إعدادات" },
  ];

  return (
    <div className="space-y-4">
      <div className="glass-card p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-ice-blue-600" />
            <span className="font-black text-ink-primary">{logs.length}</span>
            <span className="text-sm text-ink-muted">سجل</span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted" />
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث في السجل..."
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl py-2 pr-9 pl-3 text-sm text-ink-primary outline-none focus:border-ice-blue-500 transition font-medium" />
            </div>
            <button onClick={load} className="text-ink-muted hover:text-ink-secondary p-2 hover:bg-slate-100 rounded-lg transition border-2 border-transparent hover:border-slate-200" title="تحديث">
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

      {error && (
        <div className="bg-red-50 border-2 border-red-200 text-red-600 font-bold text-sm p-4 rounded-xl flex items-start gap-2">
          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-ink-muted">
          <div className="animate-spin w-6 h-6 border-2 border-ice-blue-500 border-t-transparent rounded-full mx-auto mb-2" />
          <p className="text-sm font-bold">جاري التحميل...</p>
        </div>
      ) : filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((l, i) => {
            const colorClass = ACTION_COLORS[l.action] || "text-slate-600 bg-slate-50 border-slate-200";
            return (
              <div key={l.id || i} className="glass-card p-4">
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-lg ${colorClass} flex items-center justify-center shrink-0`}>
                    <Shield className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-xs font-black px-2 py-0.5 rounded-lg border-2 ${colorClass}`}>
                        {ACTION_LABELS[l.action] || l.action}
                      </span>
                      {l.details && <span className="text-xs text-ink-muted truncate max-w-xs">{l.details}</span>}
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-ink-muted mt-1" dir="ltr">
                      <span>Admin: {l.adminUid?.slice(0, 8)}...</span>
                      {l.targetUid && <span>Target: {l.targetUid.slice(0, 8)}...</span>}
                      {l.createdAt && (
                        <span>
                          {l.createdAt.toDate
                            ? new Date(l.createdAt.toDate()).toLocaleString("ar-JO")
                            : l.createdAt._seconds
                              ? new Date(l.createdAt._seconds * 1000).toLocaleString("ar-JO")
                              : ""}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 text-ink-muted">
          <History className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm font-black">لا يوجد سجلات</p>
        </div>
      )}
    </div>
  );
}
