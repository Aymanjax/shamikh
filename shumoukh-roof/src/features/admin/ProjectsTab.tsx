// @ts-nocheck
import { useState, useEffect } from "react";
import { FolderOpen, Search, RotateCw, Trash2, AlertCircle, Eye } from "lucide-react";
import { adminApi } from "./adminApiService";

const STATUS_LABELS: Record<string, string> = {
  draft: "مسودة", sent: "مرسل", approved: "موافق",
  in_progress: "قيد التنفيذ", completed: "مكتمل",
};
const STATUS_COLORS: Record<string, string> = {
  draft: "text-slate-600 bg-slate-50 border-slate-200",
  sent: "text-ice-blue-600 bg-ice-blue-50 border-ice-blue-200",
  approved: "text-amber-600 bg-amber-50 border-amber-200",
  in_progress: "text-emerald-600 bg-emerald-50 border-emerald-200",
  completed: "text-emerald-600 bg-emerald-50 border-emerald-200",
};

export default function ProjectsTab() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await adminApi.getProjects();
      setProjects(res.data || []);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (project: any) => {
    if (!window.confirm(`هل أنت متأكد من حذف مشروع "${project.client?.name || project.id}"؟`)) return;
    try {
      await adminApi.deleteProject(project.id, project.userId);
      setProjects((prev) => prev.filter((p) => p.id !== project.id));
    } catch (e: any) {
      setError(e.message);
    }
  };

  const filtered = projects
    .filter((p) => (filter === "all" ? true : p.status === filter))
    .filter((p) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (p.client?.name || "").toLowerCase().includes(q) ||
        (p.client?.phone || "").toLowerCase().includes(q) ||
        (p.id || "").toLowerCase().includes(q);
    });

  const FILTERS = [
    { key: "all", label: "الكل" },
    { key: "draft", label: "مسودة" },
    { key: "in_progress", label: "قيد التنفيذ" },
    { key: "completed", label: "مكتمل" },
  ];

  return (
    <div className="space-y-4">
      <div className="glass-card p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-amber-600" />
            <span className="font-black text-ink-primary">{projects.length}</span>
            <span className="text-sm text-ink-muted">مشروع</span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted" />
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث باسم العميل..."
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
                filter === f.key ? "bg-amber-600 text-white border-amber-600" : "bg-white text-ink-muted border-slate-200 hover:border-slate-300"
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
          {filtered.map((p) => (
            <div key={p.id} className="glass-card p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black text-ink-primary truncate">
                    {p.client?.name || "بدون اسم"}
                  </p>
                  {p.client?.phone && (
                    <p className="text-xs text-ink-muted" dir="ltr">{p.client.phone}</p>
                  )}
                  {p.client?.address && (
                    <p className="text-xs text-ink-muted truncate">{p.client.address}</p>
                  )}
                </div>
                <span className={`text-xs font-black px-2 py-0.5 rounded-lg border-2 shrink-0 ${STATUS_COLORS[p.status] || "text-slate-600 bg-slate-50 border-slate-200"}`}>
                  {STATUS_LABELS[p.status] || p.status}
                </span>
              </div>
              {p.order && p.order.length > 0 && (
                <div className="mb-3">
                  <p className="text-[10px] text-ink-muted font-bold mb-1">البنود:</p>
                  <div className="flex flex-wrap gap-1">
                    {p.order.filter((o: any) => o.quantity > 0).slice(0, 4).map((o: any) => (
                      <span key={o.id} className="text-[10px] bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5 text-ink-muted">
                        {o.name}: {o.quantity}
                      </span>
                    ))}
                    {p.order.filter((o: any) => o.quantity > 0).length > 4 && (
                      <span className="text-[10px] text-ink-muted">+{p.order.filter((o: any) => o.quantity > 0).length - 4}</span>
                    )}
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between text-[10px] text-ink-muted mb-3">
                <span>{new Date(p.createdAt).toLocaleDateString("ar-JO")}</span>
                {p.result?.totalCost && <span className="font-bold">{p.result.totalCost.toFixed(0)} د.أ</span>}
              </div>
              <button onClick={() => handleDelete(p)}
                className="w-full text-xs font-black text-red-600 bg-red-50 hover:bg-red-100 py-1.5 rounded-lg transition flex items-center justify-center gap-1 border-2 border-red-200">
                <Trash2 className="w-3 h-3" /> حذف
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-ink-muted">
          <FolderOpen className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm font-black">لا توجد مشاريع</p>
        </div>
      )}
    </div>
  );
}
