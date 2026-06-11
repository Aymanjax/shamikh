// @ts-nocheck
import { useState, useEffect } from "react";
import { Truck, Search, RotateCw, AlertCircle, Ban, UserCheck, Check, X, Store, Phone, MapPin } from "lucide-react";
import { adminApi } from "./adminApiService";

export default function SuppliersTab() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await adminApi.getSuppliers();
      setSuppliers(res.data || []);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleApprove = async (uid: string) => {
    try {
      await adminApi.approveSupplier(uid);
      setSuppliers((prev) => prev.map((s) => (s.uid === uid ? { ...s, approved: true } : s)));
    } catch (e: any) { setError(e.message); }
  };

  const handleBan = async (uid: string) => {
    try {
      await adminApi.banSupplier(uid);
      setSuppliers((prev) => prev.map((s) => (s.uid === uid ? { ...s, banned: !s.banned } : s)));
    } catch (e: any) { setError(e.message); }
  };

  const filtered = suppliers
    .filter((s) => {
      if (filter === "approved") return s.approved;
      if (filter === "pending") return !s.approved && !s.banned;
      if (filter === "banned") return s.banned;
      return true;
    })
    .filter((s) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (s.businessName || "").toLowerCase().includes(q) ||
        (s.email || "").toLowerCase().includes(q) ||
        (s.phone || "").includes(q) ||
        (s.area || "").toLowerCase().includes(q);
    });

  const FILTERS = [
    { key: "all", label: "الكل" },
    { key: "approved", label: "مقبول" },
    { key: "pending", label: "معلق" },
    { key: "banned", label: "محظور" },
  ];

  return (
    <div className="space-y-4">
      <div className="glass-card p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-amber-600" />
            <span className="font-black text-ink-primary">{suppliers.length}</span>
            <span className="text-sm text-ink-muted">مورد</span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted" />
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث باسم أو منطقة..."
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl py-2 pr-9 pl-3 text-sm text-ink-primary outline-none focus:border-amber-500 transition font-medium" />
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
                filter === f.key ? "bg-amber-600 text-earth-100 border-amber-600" : "bg-white text-ink-muted border-slate-200 hover:border-slate-300"
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
          <div className="animate-spin w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full mx-auto mb-2" />
          <p className="text-sm font-bold">جاري التحميل...</p>
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((s) => (
            <div key={s.uid} className="glass-card p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-amber-600 flex items-center justify-center text-earth-100 font-black text-sm shrink-0">
                    {(s.businessName || "?")[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-ink-primary truncate">{s.businessName}</p>
                    <p className="text-xs text-ink-muted truncate" dir="ltr">{s.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {s.banned && <span className="text-xs font-black text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-lg">محظور</span>}
                  {s.approved ? (
                    <span className="text-xs font-black text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg flex items-center gap-1"><Check className="w-3 h-3" /> مقبول</span>
                  ) : (
                    <span className="text-xs font-black text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg flex items-center gap-1"><X className="w-3 h-3" /> معلق</span>
                  )}
                </div>
              </div>
              <div className="space-y-1 mb-3 text-xs text-ink-muted">
                {s.phone && <div className="flex items-center gap-1"><Phone className="w-3 h-3" /> {s.phone}</div>}
                {s.area && <div className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {s.area}</div>}
                {s.activity && <div className="flex items-center gap-1"><Store className="w-3 h-3" /> {s.activity}</div>}
              </div>
              <div className="flex items-center gap-1">
                {!s.approved && (
                  <button onClick={() => handleApprove(s.uid)}
                    className="flex-1 text-xs font-black text-emerald-600 bg-emerald-50 hover:bg-emerald-100 py-1.5 rounded-lg transition flex items-center justify-center gap-1 border-2 border-emerald-200">
                    <UserCheck className="w-3 h-3" /> قبول
                  </button>
                )}
                <button onClick={() => handleBan(s.uid)}
                  className={`flex-1 text-xs font-black py-1.5 rounded-lg transition flex items-center justify-center gap-1 border-2 ${
                    s.banned
                      ? "text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border-emerald-200"
                      : "text-red-600 bg-red-50 hover:bg-red-100 border-red-200"
                  }`}>
                  {s.banned ? <UserCheck className="w-3 h-3" /> : <Ban className="w-3 h-3" />}
                  {s.banned ? "رفع الحظر" : "حظر"}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-ink-muted">
          <Truck className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm font-black">لا يوجد موردين</p>
        </div>
      )}
    </div>
  );
}
