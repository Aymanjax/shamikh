import { useState } from "react";
import { Link } from "react-router-dom";
import { useProjects } from "../hooks/useProjects";
import { useAuthStore } from "../store/authStore";
import { projectStatuses } from "../services/projectService";

const statusColors = {
  draft: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  sent: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  approved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  in_progress: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  completed: "bg-green-500/10 text-green-400 border-green-500/20",
};

const statusLabels = {
  draft: "مسودة", sent: "أرسل للعميل", approved: "موافق عليه",
  in_progress: "قيد التنفيذ", completed: "منجز",
};

export default function ProjectsPage() {
  const { loading: authLoading } = useAuthStore();
  const { projects, loading, error } = useProjects();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <i className="fa-solid fa-exclamation-triangle text-4xl text-red-400 mb-4"></i>
        <h2 className="text-lg font-bold text-red-400">خطأ في تحميل المشاريع</h2>
        <p className="text-slate-400 text-sm mt-1">{error}</p>
        <button onClick={() => window.location.reload()}
          className="mt-4 bg-brand-600 hover:bg-brand-700 py-2 px-5 rounded-xl font-bold text-sm transition">
          إعادة تحميل
        </button>
      </div>
    );
  }

  const filtered = projects.filter((p) => {
    const matchSearch = p.client?.name?.includes(search) || p.client?.phone?.includes(search);
    const matchStatus = filterStatus === "all" || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black">المشاريع</h1>
          <p className="text-sm text-slate-400">{projects.length} مشروع</p>
        </div>
        <Link to="/projects/new"
          className="bg-gradient-to-r from-brand-600 to-amber-500 py-2.5 px-5 rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transition flex items-center gap-2">
          <i className="fa-solid fa-plus"></i> مشروع جديد
        </Link>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-500"></div>
        </div>
      )}

      {!loading && projects.length === 0 && (
        <div className="bg-[#0f172a] border border-white/5 rounded-2xl p-12 text-center">
          <i className="fa-solid fa-folder-open text-5xl text-slate-600 mb-4"></i>
          <h2 className="text-lg font-bold">لا توجد مشاريع بعد</h2>
          <p className="text-slate-400 text-sm mt-1">أنشئ أول مشروع لك الآن</p>
          <Link to="/projects/new"
            className="inline-block mt-4 bg-brand-600 hover:bg-brand-700 py-2 px-5 rounded-xl font-bold text-sm transition">
            إنشاء مشروع
          </Link>
        </div>
      )}

      {!loading && projects.length > 0 && (
        <>
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <i className="fa-solid fa-search absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"></i>
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث باسم العميل أو رقم الهاتف..."
                className="w-full bg-[#0f172a] border border-white/5 rounded-xl py-2.5 pr-10 pl-4 text-white outline-none focus:border-brand-500 text-sm" />
            </div>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-[#0f172a] border border-white/5 rounded-xl py-2.5 px-4 text-white outline-none focus:border-brand-500 text-sm">
              <option value="all">كل المشاريع</option>
              {projectStatuses.map((s) => <option key={s} value={s}>{statusLabels[s]}</option>)}
            </select>
          </div>

          <div className="grid gap-4">
            {filtered.map((project) => (
              <Link key={project.id} to={`/projects/${project.id}`}
                className="bg-[#0f172a] border border-white/5 rounded-2xl p-5 hover:border-brand-500/30 transition block">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg">{project.client?.name || "بدون اسم"}</h3>
                    <div className="flex gap-4 text-sm text-slate-400 mt-1">
                      <span><i className="fa-solid fa-phone ml-1"></i>{project.client?.phone || "-"}</span>
                      <span><i className="fa-solid fa-ruler-combined ml-1"></i>{project.roof?.segments?.[0]?.length || "?"}×{project.roof?.segments?.[0]?.width || "?"} م</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-bold px-3 py-1 rounded-full border ${statusColors[project.status] || statusColors.draft}`}>
                      {statusLabels[project.status] || project.status}
                    </span>
                    <i className="fa-solid fa-chevron-left text-slate-500"></i>
                  </div>
                </div>
                <div className="text-xs text-slate-500 mt-3">
                  {new Date(project.createdAt).toLocaleDateString("ar-JO")}
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
