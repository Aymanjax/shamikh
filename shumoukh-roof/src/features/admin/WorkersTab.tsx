// @ts-nocheck
import { useState, useEffect } from "react";
import { HardHat, Search, RotateCw, AlertCircle, DollarSign, Calendar } from "lucide-react";
import { adminApi } from "./adminApiService";

export default function WorkersTab() {
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await adminApi.getWorkers();
      setWorkers(res.data || []);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const totalWages = workers.reduce((s, w) => s + (w.wage || 0) * (w.days || 0), 0);
  const totalDays = workers.reduce((s, w) => s + (w.days || 0), 0);

  const filtered = workers.filter((w) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (w.name || "").toLowerCase().includes(q) ||
      (w.role || "").toLowerCase().includes(q) ||
      (w.project || "").toLowerCase().includes(q) ||
      (w.phone || "").includes(q);
  });

  return (
    <div className="space-y-4">
      <div className="glass-card p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <HardHat className="w-5 h-5 text-slate-600" />
            <span className="font-black text-ink-primary">{workers.length}</span>
            <span className="text-sm text-ink-muted">عامل</span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted" />
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث باسم أو دور..."
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl py-2 pr-9 pl-3 text-sm text-ink-primary outline-none focus:border-slate-500 transition font-medium" />
            </div>
            <button onClick={load} className="text-ink-muted hover:text-ink-secondary p-2 hover:bg-slate-100 rounded-lg transition border-2 border-transparent hover:border-slate-200" title="تحديث">
              <RotateCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card p-3 text-center">
          <p className="text-xs text-ink-muted font-bold">إجمالي العمال</p>
          <p className="text-lg font-black text-ink-primary">{workers.length}</p>
        </div>
        <div className="glass-card p-3 text-center">
          <p className="text-xs text-ink-muted font-bold">إجمالي الرواتب</p>
          <p className="text-lg font-black text-amber-600">{totalWages.toFixed(0)} د.أ</p>
        </div>
        <div className="glass-card p-3 text-center">
          <p className="text-xs text-ink-muted font-bold">إجمالي الأيام</p>
          <p className="text-lg font-black text-ice-blue-600">{totalDays}</p>
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
          <div className="animate-spin w-6 h-6 border-2 border-slate-500 border-t-transparent rounded-full mx-auto mb-2" />
          <p className="text-sm font-bold">جاري التحميل...</p>
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((w) => (
            <div key={w.id} className="glass-card p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-slate-600 flex items-center justify-center text-white font-black text-sm shrink-0">
                    {(w.name || "?")[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-ink-primary truncate">{w.name}</p>
                    <p className="text-xs text-ink-muted">{w.role}</p>
                  </div>
                </div>
                <span className="text-xs font-black text-ink-muted bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-lg shrink-0">
                  {w.phone || "بدون هاتف"}
                </span>
              </div>
              {w.project && <p className="text-xs text-ink-muted mb-2">مشروع: {w.project}</p>}
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 text-ink-muted">
                  <DollarSign className="w-3 h-3" /> {w.wage} × {w.days} يوم
                </span>
                <span className="font-black text-amber-600">{(w.wage * w.days).toFixed(0)} د.أ</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-ink-muted">
          <HardHat className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm font-black">لا يوجد عمال</p>
        </div>
      )}
    </div>
  );
}
