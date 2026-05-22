import { useState } from "react";
import { Link } from "react-router-dom";
import { useProjects } from "../hooks/useProjects";
import { useAuthStore } from "../store/authStore";
import { projectStatuses } from "../services/projectService";

const statusColors = {
  draft: "bg-surface-subtle text-ink border-line",
  sent: "bg-blue-50 text-blue-600 border-blue-200",
  approved: "bg-emerald-50 text-emerald-600 border-emerald-200",
  in_progress: "bg-amber-50 text-amber-600 border-amber-200",
  completed: "bg-green-50 text-green-600 border-green-200",
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
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <i className="fa-solid fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
        <h2 className="text-lg font-bold text-red-500">خطأ في تحميل المشاريع</h2>
        <p className="text-ink-muted text-sm mt-1">{error}</p>
        <button onClick={() => window.location.reload()}
          className="mt-4 bg-amber-500 hover:bg-amber-600 text-white py-2 px-5 rounded-xl font-bold text-sm transition">
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
          <p className="text-sm text-ink-muted">{projects.length} مشروع</p>
        </div>
        <Link to="/projects/new"
          className="bg-gradient-to-r from-amber-500 to-amber-600 text-white py-2.5 px-5 rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transition flex items-center gap-2">
          <i className="fa-solid fa-plus"></i> مشروع جديد
        </Link>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-500"></div>
        </div>
      )}

      {!loading && projects.length === 0 && (
        <div className="bg-surface border border-line rounded-2xl p-12 text-center shadow-sm">
          <i className="fa-solid fa-folder-open text-5xl text-ink-light mb-4"></i>
          <h2 className="text-lg font-bold">لا توجد مشاريع بعد</h2>
          <p className="text-ink-muted text-sm mt-1">أنشئ أول مشروع لك الآن</p>
          <Link to="/projects/new"
            className="inline-block mt-4 bg-amber-500 hover:bg-amber-600 text-white py-2 px-5 rounded-xl font-bold text-sm transition">
            إنشاء مشروع
          </Link>
        </div>
      )}

      {!loading && projects.length > 0 && (
        <>
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <i className="fa-solid fa-search absolute right-4 top-1/2 -translate-y-1/2 text-ink-muted"></i>
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث باسم العميل أو رقم الهاتف..."
                className="w-full bg-surface border border-line rounded-xl py-2.5 pr-10 pl-4 text-ink outline-none focus:border-amber-500 transition text-sm" />
            </div>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-surface border border-line rounded-xl py-2.5 px-4 text-ink outline-none focus:border-amber-500 transition text-sm">
              <option value="all">كل المشاريع</option>
              {projectStatuses.map((s) => <option key={s} value={s}>{statusLabels[s]}</option>)}
            </select>
          </div>

          <div className="grid gap-4">
            {filtered.map((project) => (
              <Link key={project.id} to={`/projects/${project.id}`}
                className="bg-surface border border-line rounded-2xl p-5 hover:border-amber-300 transition block shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg">{project.client?.name || "بدون اسم"}</h3>
                    <div className="flex gap-4 text-sm text-ink-muted mt-1">
                      <span><i className="fa-solid fa-phone ml-1"></i>{project.client?.phone || "-"}</span>
                      <span><i className="fa-solid fa-ruler-combined ml-1"></i>{project.roof?.segments?.[0]?.length || "?"}×{project.roof?.segments?.[0]?.width || "?"} م</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-bold px-3 py-1 rounded-full border ${statusColors[project.status] || statusColors.draft}`}>
                      {statusLabels[project.status] || project.status}
                    </span>
                    <i className="fa-solid fa-chevron-left text-ink-muted"></i>
                  </div>
                </div>
                <div className="text-xs text-ink-muted mt-3">
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