import { useState, useEffect } from "react";
import { db } from "../services/firebase";
import { collection, getDocs } from "firebase/firestore";
import { useAuthStore } from "../store/authStore";

export default function ReportsPage() {
  const { user } = useAuthStore();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getDocs(collection(db, "users", user.uid, "projects")).then((snap) => {
      setProjects(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user]);

  const total = projects.length;
  const completed = projects.filter((p) => p.status === "completed").length;
  const inProgress = projects.filter((p) => p.status === "in_progress").length;
  const sent = projects.filter((p) => p.status === "sent" || p.status === "approved").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black">التقارير</h1>
        <p className="text-sm text-ink-muted">إحصائيات وإنجازات المشاريع</p>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-500 mx-auto"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-surface border border-line rounded-2xl p-4 text-center shadow-sm">
              <p className="text-3xl font-black text-amber-600">{total}</p>
              <p className="text-xs text-ink-muted mt-1">إجمالي المشاريع</p>
            </div>
            <div className="bg-surface border border-line rounded-2xl p-4 text-center shadow-sm">
              <p className="text-3xl font-black text-emerald-600">{completed}</p>
              <p className="text-xs text-ink-muted mt-1">منجز</p>
            </div>
            <div className="bg-surface border border-line rounded-2xl p-4 text-center shadow-sm">
              <p className="text-3xl font-black text-amber-600">{inProgress}</p>
              <p className="text-xs text-ink-muted mt-1">قيد التنفيذ</p>
            </div>
            <div className="bg-surface border border-line rounded-2xl p-4 text-center shadow-sm">
              <p className="text-3xl font-black text-blue-600">{sent}</p>
              <p className="text-xs text-ink-muted mt-1">مُرسل/معتمد</p>
            </div>
          </div>

          <div className="bg-surface border border-line rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <i className="fa-solid fa-list text-amber-600"></i> آخر المشاريع
            </h3>
            <div className="space-y-2">
              {projects.slice(-10).reverse().map((p) => (
                <div key={p.id} className="flex justify-between items-center bg-surface-subtle rounded-xl px-4 py-2.5">
                  <span className="text-sm font-bold">{p.client?.name || "بدون اسم"}</span>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${
                    p.status === "completed" ? "bg-green-100 text-green-700" :
                    p.status === "in_progress" ? "bg-amber-100 text-amber-700" :
                    p.status === "approved" ? "bg-emerald-100 text-emerald-700" :
                    p.status === "sent" ? "bg-blue-100 text-blue-700" :
                    "bg-surface-subtle text-ink"
                  }`}>
                    {p.status === "completed" ? "منجز" :
                     p.status === "in_progress" ? "قيد التنفيذ" :
                     p.status === "approved" ? "موافق عليه" :
                     p.status === "sent" ? "مُرسل" : "مسودة"}
                  </span>
                </div>
              ))}
              {projects.length === 0 && (
                <p className="text-sm text-ink-muted text-center py-4">لا توجد مشاريع بعد</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}