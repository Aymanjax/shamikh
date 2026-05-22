import { useState, useEffect } from "react";
import { db } from "../services/firebase";
import { collection, getDocs } from "firebase/firestore";
import { useAuthStore } from "../store/authStore";
import { Link } from "react-router-dom";
import { trackVisit, getVisitorStats } from "../services/visitorService";

const QUICK_LINKS = [
  { to: "/calculator", icon: "fa-calculator", label: "حاسبة القرميد", desc: "احسب الكميات بضغطة زر", color: "from-amber-500 to-amber-600", shadow: "shadow-amber-500/30" },
  { to: "/projects/new", icon: "fa-plus-circle", label: "مشروع جديد", desc: "إضافة مشروع ومتابعته", color: "from-emerald-500 to-emerald-600", shadow: "shadow-emerald-500/30" },
  { to: "/projects", icon: "fa-folder-open", label: "كل المشاريع", desc: "إدارة وعرض المشاريع", color: "from-blue-500 to-blue-600", shadow: "shadow-blue-500/30" },
  { to: "/workers", icon: "fa-users-gear", label: "العمال", desc: "حضور وإجور يومية", color: "from-purple-500 to-purple-600", shadow: "shadow-purple-500/30" },
  { to: "/invoices", icon: "fa-file-invoice", label: "الفواتير", desc: "إصدار عروض سعر وفواتير", color: "from-rose-500 to-rose-600", shadow: "shadow-rose-500/30" },
  { to: "/reports", icon: "fa-chart-line", label: "التقارير", desc: "أرباح وإحصائيات", color: "from-cyan-500 to-cyan-600", shadow: "shadow-cyan-500/30" },
];

export default function Dashboard() {
  const { user, role, companyName, subscription } = useAuthStore();
  const [stats, setStats] = useState({ projects: 0, completed: 0, inProgress: 0 });
  const [recentProjects, setRecentProjects] = useState([]);
  const [visitors, setVisitors] = useState(null);

  const displayName = companyName || user?.displayName || "شموخ ERP";

  useEffect(() => { trackVisit(); }, []);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      try {
        const snap = await getDocs(collection(db, "users", user.uid, "projects"));
        const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setStats({
          projects: all.length,
          completed: all.filter((p) => p.status === "completed").length,
          inProgress: all.filter((p) => p.status === "in_progress").length,
        });
        const sorted = [...all].sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
        setRecentProjects(sorted.slice(0, 5));
      } catch (e) { console.error(e); }
      if (role === "admin") {
        getVisitorStats().then(setVisitors).catch(() => {});
      }
    };
    load();
  }, [user, role]);

  const statusBadge = (status) => {
    const m = { pending: "text-amber-600 bg-amber-50", in_progress: "text-blue-600 bg-blue-50", completed: "text-emerald-600 bg-emerald-50" };
    const l = { pending: "معلق", in_progress: "قيد التنفيذ", completed: "منجز" };
    return <span className={`text-[10px] font-bold py-0.5 px-2 rounded ${m[status] || m.pending}`}>{l[status] || status}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-brand-600 to-amber-600 rounded-2xl p-6 md:p-8 text-white shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="bg-white/20 p-3 rounded-2xl">
            <i className="fa-solid fa-hotel text-white text-2xl"></i>
          </div>
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-black">{displayName}</h1>
            <p className="text-white/80 text-sm mt-1">نظام إدارة مشاريع القرميد — احسب كميات ورشتك بضغطة زر</p>
            {subscription && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] font-bold py-0.5 px-2 rounded-full bg-white/20 text-white">
                  {subscription.plan === "lifetime" ? "مدى الحياة" : subscription.plan === "premium" ? "مميز" : subscription.plan === "basic" ? "أساسي" : "تجريبي"}
                </span>
                {subscription.expiresAt && (() => {
                  let exp = null;
                  if (typeof subscription.expiresAt.toMillis === "function") exp = subscription.expiresAt.toMillis();
                  else if (subscription.expiresAt instanceof Date) exp = subscription.expiresAt.getTime();
                  else if (typeof subscription.expiresAt === "number") exp = subscription.expiresAt;
                  else if (typeof subscription.expiresAt === "string") exp = new Date(subscription.expiresAt).getTime();
                  if (!exp) return null;
                  const remaining = Math.ceil((exp - Date.now()) / (1000*60*60*24));
                  return (
                    <span className={`text-[10px] text-white/70`}>
                      {remaining <= 0 ? "· منتهي" : `· متبقي ${remaining} يوم`}
                    </span>
                  );
                })()}
              </div>
            )}
          </div>
          <Link to="/calculator" className="bg-white text-brand-700 font-black py-2.5 px-5 rounded-xl text-sm hover:bg-amber-50 transition shadow-lg flex items-center gap-2 whitespace-nowrap">
            <i className="fa-solid fa-calculator"></i>
            حساب الكميات
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "إجمالي المشاريع", value: stats.projects, icon: "fa-folder-open", color: "text-brand-600 bg-brand-50" },
          { label: "منجز", value: stats.completed, icon: "fa-check-circle", color: "text-emerald-600 bg-emerald-50" },
          { label: "قيد التنفيذ", value: stats.inProgress, icon: "fa-spinner", color: "text-amber-600 bg-amber-50" },
          { label: "عمال مسجلين", value: stats.workers || "-", icon: "fa-users-gear", color: "text-purple-600 bg-purple-50" },
        ].map((s, i) => (
          <div key={i} className={`rounded-2xl p-4 border border-line bg-surface flex items-center gap-3`}>
            <div className={`w-10 h-10 ${s.color} flex items-center justify-center rounded-xl shrink-0`}>
              <i className={`fa-solid ${s.icon}`}></i>
            </div>
            <div>
              <p className="text-xl font-black text-ink">{s.value}</p>
              <p className="text-[9px] text-ink-muted">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {QUICK_LINKS.map((link, i) => (
          <Link key={i} to={link.to} className={`bg-gradient-to-br ${link.color} rounded-2xl p-4 text-white shadow-lg ${link.shadow} hover:scale-[1.02] transition-transform`}>
            <i className={`fa-solid ${link.icon} text-xl`}></i>
            <p className="font-bold text-sm mt-2">{link.label}</p>
            <p className="text-[9px] text-white/80 mt-0.5">{link.desc}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface border border-line rounded-2xl p-5">
          <h3 className="font-bold text-ink mb-4 flex items-center gap-2">
            <i className="fa-solid fa-clock-rotate-left text-blue-500"></i> آخر المشاريع
          </h3>
          {recentProjects.length === 0 ? (
            <div className="text-center py-8">
              <i className="fa-solid fa-folder-open text-3xl text-ink-muted/30 mb-2"></i>
              <p className="text-sm text-ink-muted">لا توجد مشاريع بعد</p>
              <Link to="/projects/new" className="inline-block mt-3 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold py-2 px-4 rounded-xl transition">
                <i className="fa-solid fa-plus ml-1"></i> أول مشروع
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recentProjects.map((p) => (
                <Link key={p.id} to={`/projects/${p.id}`}
                  className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-surface-subtle transition border border-line">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-600/20 to-amber-500/20 flex items-center justify-center shrink-0">
                      <i className="fa-solid fa-layer-group text-xs text-brand-600"></i>
                    </div>
                    <span className="text-sm font-bold text-ink truncate">{p.name || "مشروع"}</span>
                  </div>
                  {statusBadge(p.status)}
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          {role === "admin" && visitors && (
            <div className="bg-surface border border-line rounded-2xl p-5">
              <h3 className="font-bold text-ink flex items-center gap-2 mb-4">
                <i className="fa-solid fa-globe text-brand-600"></i> زوار الموقع
              </h3>
              <div className="grid grid-cols-4 gap-2 mb-4">
                {[
                  { label: "اليوم", value: visitors.today, color: "" },
                  { label: "الأسبوع", value: visitors.thisWeek, color: "text-amber-600" },
                  { label: "الشهر", value: visitors.thisMonth, color: "text-blue-600" },
                  { label: "الإجمالي", value: visitors.total, color: "" },
                ].map((s, i) => (
                  <div key={i} className="bg-surface-alt rounded-xl p-2 text-center">
                    <p className={`text-lg font-black ${s.color || "text-ink"}`}>{s.value}</p>
                    <p className="text-[8px] text-ink-muted">{s.label}</p>
                  </div>
                ))}
              </div>
              {visitors.last7?.length > 0 && (
                <div className="flex items-end gap-1 h-12">
                  {visitors.last7.map((d, i) => {
                    const max = Math.max(...visitors.last7.map((x) => x.count), 1);
                    const h = Math.max(3, (d.count / max) * 44);
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                        <span className="text-[7px] font-bold text-ink-muted">{d.count}</span>
                        <div className="w-full bg-amber-100 rounded-sm" style={{ height: `${h}px` }}>
                          <div className="bg-gradient-to-t from-amber-600 to-amber-500 rounded-sm w-full h-full"></div>
                        </div>
                        <span className="text-[6px] text-ink-muted">{d.date.slice(5)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div className="bg-surface border border-line rounded-2xl p-5">
            <h3 className="font-bold text-ink mb-3 flex items-center gap-2">
              <i className="fa-solid fa-gear text-ink-muted"></i> الإعدادات
            </h3>
            <div className="space-y-1">
              {[
                { to: "/settings", icon: "fa-building", label: "الملف الشخصي والبيانات" },
                { to: "/settings", icon: "fa-tags", label: "الأسعار والتسعير" },
                { to: "/settings", icon: "fa-cubes", label: "المواد الإضافية" },
                ...(role === "admin" ? [{ to: "/admin", icon: "fa-shield-halved", label: "لوحة التحكم", color: "text-amber-600" }] : []),
              ].map((item, i) => (
                <Link key={i} to={item.to} className={`flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-surface-subtle transition text-sm ${item.color || "text-ink"}`}>
                  <i className={`fa-solid ${item.icon} text-ink-muted`}></i>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
