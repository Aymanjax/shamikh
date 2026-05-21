import { useState, useEffect } from "react";
import { db } from "../services/firebase";
import { collection, getDocs } from "firebase/firestore";
import { useAuthStore } from "../store/authStore";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({ projects: 0, completed: 0, inProgress: 0 });

  useEffect(() => {
    const loadStats = async () => {
      if (!user) return;
      const snap = await getDocs(collection(db, "users", user.uid, "projects"));
      const all = snap.docs.map((d) => d.data());
      setStats({
        projects: all.length,
        completed: all.filter((p) => p.status === "completed").length,
        inProgress: all.filter((p) => p.status === "in_progress").length,
      });
    };
    loadStats();
  }, [user]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black">لوحة الأرباح</h1>
        <p className="text-sm text-slate-400">مرحباً {user?.displayName || "المستخدم"}، هذه نظرة عامة على أعمالك</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link to="/projects" className="bg-[#0f172a] border border-white/5 rounded-2xl p-5 hover:border-brand-500/30 transition">
          <div className="flex items-center gap-3">
            <div className="bg-brand-500/10 text-brand-500 w-12 h-12 flex items-center justify-center rounded-2xl">
              <i className="fa-solid fa-folder-open text-xl"></i>
            </div>
            <div>
              <p className="text-3xl font-black">{stats.projects}</p>
              <p className="text-xs text-slate-400">إجمالي المشاريع</p>
            </div>
          </div>
        </Link>

        <div className="bg-[#0f172a] border border-white/5 rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500/10 text-emerald-400 w-12 h-12 flex items-center justify-center rounded-2xl">
              <i className="fa-solid fa-check-circle text-xl"></i>
            </div>
            <div>
              <p className="text-3xl font-black">{stats.completed}</p>
              <p className="text-xs text-slate-400">منجز</p>
            </div>
          </div>
        </div>

        <div className="bg-[#0f172a] border border-white/5 rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500/10 text-amber-400 w-12 h-12 flex items-center justify-center rounded-2xl">
              <i className="fa-solid fa-spinner text-xl"></i>
            </div>
            <div>
              <p className="text-3xl font-black">{stats.inProgress}</p>
              <p className="text-xs text-slate-400">قيد التنفيذ</p>
            </div>
          </div>
        </div>

        <div className="bg-[#0f172a] border border-white/5 rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500/10 text-blue-400 w-12 h-12 flex items-center justify-center rounded-2xl">
              <i className="fa-solid fa-calculator text-xl"></i>
            </div>
            <div>
              <p className="text-xl font-black text-brand-500">جديد</p>
              <p className="text-xs text-slate-400">
                <Link to="/projects/new" className="hover:underline">أنشئ مشروع</Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#0f172a] border border-white/5 rounded-2xl p-6">
          <h3 className="font-bold mb-4 flex items-center gap-2"><i className="fa-solid fa-chart-simple text-brand-500"></i> أدوات سريعة</h3>
          <div className="grid grid-cols-2 gap-3">
            <Link to="/calculator" className="bg-slate-900/40 border border-white/5 rounded-xl p-4 text-center hover:border-brand-500/30 transition">
              <i className="fa-solid fa-calculator text-2xl text-brand-500"></i>
              <p className="text-sm font-bold mt-2">الحاسبة الذكية</p>
            </Link>
            <Link to="/projects/new" className="bg-slate-900/40 border border-white/5 rounded-xl p-4 text-center hover:border-brand-500/30 transition">
              <i className="fa-solid fa-plus-circle text-2xl text-emerald-500"></i>
              <p className="text-sm font-bold mt-2">مشروع جديد</p>
            </Link>
          </div>
        </div>

        <div className="bg-[#0f172a] border border-white/5 rounded-2xl p-6">
          <h3 className="font-bold mb-4 flex items-center gap-2"><i className="fa-solid fa-circle-info text-brand-500"></i> قريباً</h3>
          <div className="space-y-2 text-sm text-slate-400">
            <p><i className="fa-solid fa-chart-line ml-2 text-emerald-400"></i>رسوم بيانية للأرباح الشهرية</p>
            <p><i className="fa-solid fa-file-pdf ml-2 text-red-400"></i>تصدير فواتير PDF احترافية</p>
            <p><i className="fa-solid fa-truck ml-2 text-amber-400"></i>مقارنة أسعار الموردين</p>
            <p><i className="fa-solid fa-warehouse ml-2 text-blue-400"></i>نظام المخزون مع تنبيهات النقص</p>
          </div>
        </div>
      </div>
    </div>
  );
}
