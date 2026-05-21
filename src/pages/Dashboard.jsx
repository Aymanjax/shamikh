import { useState, useEffect } from "react";
import { db } from "../services/firebase";
import { collection, getDocs } from "firebase/firestore";
import { useAuthStore } from "../store/authStore";
import { Link } from "react-router-dom";
import { trackVisit, getVisitorStats } from "../services/visitorService";

export default function Dashboard() {
  const { user, role, companyName } = useAuthStore();
  const [stats, setStats] = useState({ projects: 0, completed: 0, inProgress: 0 });
  const [visitors, setVisitors] = useState({ total: 0, today: 0, countryList: [] });

  useEffect(() => {
    trackVisit();
  }, []);

  useEffect(() => {
    const loadStats = async () => {
      if (!user) return;
      const snap = await getDocs(collection(db, "users", user.uid, "projects"));
      const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setStats({
        projects: all.length,
        completed: all.filter((p) => p.status === "completed").length,
        inProgress: all.filter((p) => p.status === "in_progress").length,
      });
      if (role === "admin") {
        getVisitorStats().then(setVisitors).catch(() => {});
      }
    };
    loadStats();
  }, [user, role]);

  const displayName = companyName || user?.displayName || "شامخ ERP";

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-brand-600/10 to-amber-500/10 border border-brand-200 rounded-2xl p-6 md:p-8">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-tr from-brand-600 to-amber-500 p-3 rounded-2xl shadow-lg shadow-brand-600/30">
            <i className="fa-solid fa-hotel text-white text-2xl"></i>
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-ink">{displayName}</h1>
            <p className="text-sm text-ink-muted mt-1">
              مرحباً {user?.displayName || "المستخدم"}، هذه نظرة عامة على أعمالك
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Link to="/projects" className="bg-white border border-gray-200 rounded-2xl p-4 hover:border-brand-400 hover:shadow-md transition-all group">
          <div className="flex items-center gap-3">
            <div className="bg-brand-50 text-brand-600 w-10 h-10 flex items-center justify-center rounded-xl group-hover:scale-110 transition">
              <i className="fa-solid fa-folder-open"></i>
            </div>
            <div>
              <p className="text-2xl font-black text-ink">{stats.projects}</p>
              <p className="text-[10px] text-ink-muted">إجمالي المشاريع</p>
            </div>
          </div>
        </Link>

        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-50 text-emerald-600 w-10 h-10 flex items-center justify-center rounded-xl">
              <i className="fa-solid fa-check-circle"></i>
            </div>
            <div>
              <p className="text-2xl font-black text-ink">{stats.completed}</p>
              <p className="text-[10px] text-ink-muted">منجز</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-amber-50 text-amber-600 w-10 h-10 flex items-center justify-center rounded-xl">
              <i className="fa-solid fa-spinner"></i>
            </div>
            <div>
              <p className="text-2xl font-black text-ink">{stats.inProgress}</p>
              <p className="text-[10px] text-ink-muted">قيد التنفيذ</p>
            </div>
          </div>
        </div>

        <Link to="/projects/new" className="bg-white border border-gray-200 rounded-2xl p-4 hover:border-emerald-400 hover:shadow-md transition-all group">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-50 text-emerald-600 w-10 h-10 flex items-center justify-center rounded-xl group-hover:scale-110 transition">
              <i className="fa-solid fa-plus"></i>
            </div>
            <div>
              <p className="text-xl font-black text-emerald-600">جديد</p>
              <p className="text-[10px] text-ink-muted">مشروع جديد</p>
            </div>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-6">
          <h3 className="font-bold text-ink mb-4 flex items-center gap-2">
            <i className="fa-solid fa-bolt text-amber-500"></i> أدوات سريعة
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link to="/calculator" className="bg-surface-alt border border-gray-200 rounded-xl p-4 text-center hover:border-brand-400 hover:shadow-sm transition-all group">
              <i className="fa-solid fa-calculator text-2xl text-brand-600 group-hover:scale-110 transition inline-block"></i>
              <p className="text-sm font-bold text-ink mt-2">الحاسبة الذكية</p>
            </Link>
            <Link to="/projects" className="bg-surface-alt border border-gray-200 rounded-xl p-4 text-center hover:border-brand-400 hover:shadow-sm transition-all group">
              <i className="fa-solid fa-list text-2xl text-blue-600 group-hover:scale-110 transition inline-block"></i>
              <p className="text-sm font-bold text-ink mt-2">المشاريع</p>
            </Link>
            <Link to="/workers" className="bg-surface-alt border border-gray-200 rounded-xl p-4 text-center hover:border-brand-400 hover:shadow-sm transition-all group">
              <i className="fa-solid fa-users-gear text-2xl text-emerald-600 group-hover:scale-110 transition inline-block"></i>
              <p className="text-sm font-bold text-ink mt-2">العمال والرواتب</p>
            </Link>
            <Link to="/settings" className="bg-surface-alt border border-gray-200 rounded-xl p-4 text-center hover:border-brand-400 hover:shadow-sm transition-all group">
              <i className="fa-solid fa-cog text-2xl text-slate-500 group-hover:scale-110 transition inline-block"></i>
              <p className="text-sm font-bold text-ink mt-2">الإعدادات</p>
            </Link>
          </div>
        </div>

        {role === "admin" && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h3 className="font-bold text-ink mb-4 flex items-center gap-2">
              <i className="fa-solid fa-globe text-brand-600"></i> زوار الموقع
            </h3>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-surface-alt rounded-xl p-3 text-center">
                <p className="text-2xl font-black text-ink">{visitors.total}</p>
                <p className="text-[10px] text-ink-muted">إجمالي الزوار</p>
              </div>
              <div className="bg-surface-alt rounded-xl p-3 text-center">
                <p className="text-2xl font-black text-amber-600">{visitors.today}</p>
                <p className="text-[10px] text-ink-muted">زوار اليوم</p>
              </div>
            </div>
            {visitors.countryList.length > 0 && (
              <div>
                <p className="text-[10px] text-ink-muted font-bold mb-2">حسب الدولة</p>
                {visitors.countryList.slice(0, 5).map((c, i) => (
                  <div key={i} className="flex items-center justify-between py-1 border-b border-gray-100 last:border-0">
                    <span className="text-xs text-ink">{c.name}</span>
                    <span className="text-xs font-bold text-ink">{c.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
