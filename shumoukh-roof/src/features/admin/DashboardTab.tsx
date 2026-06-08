// @ts-nocheck
import { useState, useEffect } from "react";
import {
  FolderOpen, FileText, Users, DollarSign, TrendingUp,
  Calculator, Activity, Wifi, LogIn, Clock, CreditCard, HardHat,
} from "lucide-react";
import { adminApi } from "./adminApiService";

export default function DashboardTab() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState<any>(null);
  const [onlineCount, setOnlineCount] = useState(0);
  const [todayLogins, setTodayLogins] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [fullStats, online, logins, analyticsData] = await Promise.all([
        adminApi.getFullStats().catch(() => null),
        adminApi.getOnlineUsers().catch(() => ({ total: 0 })),
        adminApi.getTodayLogins().catch(() => ({ data: [] })),
        adminApi.getAnalytics().catch(() => null),
      ]);
      setStats(fullStats);
      setOnlineCount(online.total || 0);
      setTodayLogins(logins.data || []);
      setAnalytics(analyticsData?.stats || null);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 animate-pulse">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => <div key={i} className="h-28 bg-slate-200 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-2 border-red-200 text-red-600 font-bold text-sm p-4 rounded-xl">
        {error}
        <button onClick={load} className="ml-3 underline text-xs">إعادة المحاولة</button>
      </div>
    );
  }

  const cards = [
    { label: "المستخدمين", value: stats?.users ?? analytics?.totalUsers ?? "-", icon: Users, accent: "red" },
    { label: "المشاريع", value: analytics?.totalProjects ?? "-", icon: FolderOpen, accent: "amber" },
    { label: "الفواتير", value: stats?.invoices ?? analytics?.totalInvoices ?? "-", icon: FileText, accent: "ice-blue" },
    { label: "العمال", value: stats?.workers ?? analytics?.totalWorkers ?? "-", icon: HardHat, accent: "slate" },
    { label: "المدفوع", value: stats?.paidRevenue ? `${stats.paidRevenue.toFixed(0)} د.أ` : "-", icon: DollarSign, accent: "emerald" },
    { label: "المستحق", value: stats?.pendingRevenue ? `${stats.pendingRevenue.toFixed(0)} د.أ` : "-", icon: TrendingUp, accent: "amber" },
    { label: "متصلون الآن", value: onlineCount, icon: Wifi, accent: "emerald" },
    { label: "تسجيلات اليوم", value: todayLogins.length, icon: LogIn, accent: "ice-blue" },
  ];

  const accentMap: Record<string, string> = {
    amber: "text-amber-600", "ice-blue": "text-ice-blue-600",
    emerald: "text-emerald-600", red: "text-red-600", slate: "text-slate-600",
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {cards.map((c) => (
          <div key={c.label} className="glass-card p-4">
            <div className="w-9 h-9 rounded-lg bg-slate-100 border-2 border-slate-200 flex items-center justify-center mb-2">
              <c.icon className={`w-5 h-5 ${accentMap[c.accent] || "text-slate-600"}`} />
            </div>
            <p className="text-lg font-black text-ink-primary">{c.value}</p>
            <p className="text-xs text-ink-muted font-bold">{c.label}</p>
          </div>
        ))}
      </div>

      {stats?.byStatus && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="glass-card p-5">
            <h3 className="font-black text-ink-primary text-sm mb-4">حالة الفواتير</h3>
            {[
              { label: "مسودة", count: stats.byStatus.draft, color: "bg-slate-400" },
              { label: "قيد الانتظار", count: stats.byStatus.pending, color: "bg-amber-400" },
              { label: "مدفوعة", count: stats.byStatus.paid, color: "bg-emerald-400" },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-3 mb-3">
                <div className={`w-3 h-3 rounded-full ${s.color}`} />
                <span className="text-sm text-ink-muted flex-1">{s.label}</span>
                <span className="text-sm font-black text-ink-primary">{s.count}</span>
              </div>
            ))}
          </div>

          <div className="glass-card p-5">
            <h3 className="font-black text-ink-primary text-sm mb-4">ملخص مالي</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-ink-muted">إجمالي الإيرادات</span>
                <span className="text-sm font-black">{stats.totalRevenue?.toFixed(0)} د.أ</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-ink-muted">المدفوع</span>
                <span className="text-sm font-black text-emerald-600">{stats.paidRevenue?.toFixed(0)} د.أ</span>
              </div>
              <div className="border-t-2 border-slate-100 pt-2 flex justify-between">
                <span className="text-sm font-black text-ink-primary">المستحق</span>
                <span className="text-sm font-black text-amber-600">{stats.pendingRevenue?.toFixed(0)} د.أ</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {todayLogins.length > 0 && (
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <LogIn className="w-4 h-4 text-ice-blue-600" />
            <h3 className="font-black text-ink-primary text-sm">تسجيلات اليوم ({todayLogins.length})</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {todayLogins.slice(0, 12).map((u: any) => (
              <div key={u.uid} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-2">
                <div className="w-7 h-7 rounded-md bg-ice-blue-600 flex items-center justify-center text-white font-black text-xs">
                  {(u.displayName || u.email || "?")[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-ink-primary truncate" title={u.displayName || u.email || ""}>{u.displayName || u.email}</p>
                  <p className="text-[10px] text-ink-muted flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    {u.lastLogin ? new Date(u.lastLogin).toLocaleTimeString("ar-JO", { hour: "2-digit", minute: "2-digit" }) : "-"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {analytics && (
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-emerald-600" />
            <h3 className="font-black text-ink-primary text-sm">تفاصيل إضافية</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-3 text-center">
              <p className="text-xs text-ink-muted font-bold">موردين</p>
              <p className="text-lg font-black text-ink-primary">{analytics.totalSuppliers}</p>
            </div>
            <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-3 text-center">
              <p className="text-xs text-ink-muted font-bold">إعلانات</p>
              <p className="text-lg font-black text-ink-primary">{analytics.totalAnnouncements}</p>
            </div>
            <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-3 text-center">
              <p className="text-xs text-ink-muted font-bold">عروض نشطة</p>
              <p className="text-lg font-black text-ink-primary">{analytics.activeOffers}</p>
            </div>
            <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-3 text-center">
              <p className="text-xs text-ink-muted font-bold">فواتير مدفوعة</p>
              <p className="text-lg font-black text-emerald-600">{analytics.paidInvoices}</p>
            </div>
            <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-3 text-center">
              <p className="text-xs text-ink-muted font-bold">إجمالي الإيرادات</p>
              <p className="text-lg font-black text-ink-primary">{analytics.totalRevenue?.toFixed(0)} د.أ</p>
            </div>
            <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-3 text-center">
              <p className="text-xs text-ink-muted font-bold">متصلون</p>
              <p className="text-lg font-black text-emerald-600">{onlineCount}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
