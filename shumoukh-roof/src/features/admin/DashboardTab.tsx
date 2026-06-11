// @ts-nocheck
import { useState, useEffect } from "react";
import {
  FolderOpen, FileText, Users, DollarSign, TrendingUp,
  Activity, Wifi, LogIn, Clock, HardHat,
} from "lucide-react";
import { useT, getLang } from "../../i18n";
import { adminApi } from "./adminApiService";

const ACCENTS = {
  terracotta: { c: "var(--accent-terracotta)", bg: "var(--accent-terracotta-soft)" },
  olive:      { c: "var(--accent-olive)",      bg: "var(--accent-olive-soft)" },
  amber:      { c: "var(--accent-amber)",      bg: "var(--accent-amber-soft)" },
  red:        { c: "var(--accent-red)",        bg: "var(--accent-red-soft)" },
};

export default function DashboardTab() {
  const t = useT();
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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => <div key={i} className="h-28 rounded-sm shimmer-skeleton" />)}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 font-bold text-sm p-4 rounded-sm flex items-center justify-between gap-3" role="alert">
        {error}
        <button onClick={load} className="underline underline-offset-4 text-xs shrink-0 cursor-pointer">{t("admin.dash.retry")}</button>
      </div>
    );
  }

  const currency = t("common.currency");
  const cards = [
    { label: t("admin.tabs.users"), value: stats?.users ?? analytics?.totalUsers ?? "—", icon: Users, accent: "terracotta" },
    { label: t("nav.projects"), value: analytics?.totalProjects ?? "—", icon: FolderOpen, accent: "amber" },
    { label: t("nav.invoices"), value: stats?.invoices ?? analytics?.totalInvoices ?? "—", icon: FileText, accent: "olive" },
    { label: t("nav.workers"), value: stats?.workers ?? analytics?.totalWorkers ?? "—", icon: HardHat, accent: "red" },
    { label: t("admin.dash.paid"), value: stats?.paidRevenue ? `${stats.paidRevenue.toFixed(0)} ${currency}` : "—", icon: DollarSign, accent: "olive" },
    { label: t("admin.dash.pending"), value: stats?.pendingRevenue ? `${stats.pendingRevenue.toFixed(0)} ${currency}` : "—", icon: TrendingUp, accent: "amber" },
    { label: t("admin.dash.onlineNow"), value: onlineCount, icon: Wifi, accent: "olive" },
    { label: t("admin.dash.todayLogins"), value: todayLogins.length, icon: LogIn, accent: "terracotta" },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {cards.map((c) => {
          const a = ACCENTS[c.accent] || ACCENTS.terracotta;
          return (
            <div key={c.label} className="bg-white border border-earth-200 rounded-sm p-4" style={{ borderRight: `3px solid ${a.c}` }}>
              <div className="w-9 h-9 rounded-sm border-l-2 flex items-center justify-center mb-2"
                style={{ backgroundColor: a.bg, borderLeftColor: a.c }}>
                <c.icon className="w-5 h-5" style={{ color: a.c }} />
              </div>
              <p className="text-lg font-black font-mono text-earth-900">{c.value}</p>
              <p className="text-xs text-earth-500 font-bold">{c.label}</p>
            </div>
          );
        })}
      </div>

      {stats?.byStatus && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="earth-card p-5">
            <h3 className="font-black text-earth-900 text-sm mb-4">{t("admin.dash.invoiceStatus")}</h3>
            {[
              { label: t("admin.status.draft"), count: stats.byStatus.draft, color: "bg-earth-300" },
              { label: t("admin.status.pending"), count: stats.byStatus.pending, color: "bg-amber-500" },
              { label: t("admin.status.paid"), count: stats.byStatus.paid, color: "bg-olive-500" },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-3 mb-3">
                <div className={`w-3 h-3 rounded-[3px] ${s.color}`} />
                <span className="text-sm text-earth-600 flex-1">{s.label}</span>
                <span className="text-sm font-black font-mono text-earth-900">{s.count}</span>
              </div>
            ))}
          </div>

          <div className="earth-card p-5">
            <h3 className="font-black text-earth-900 text-sm mb-4">{t("admin.dash.financialSummary")}</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-earth-600">{t("admin.dash.totalRevenue")}</span>
                <span className="text-sm font-black font-mono text-earth-900">{stats.totalRevenue?.toFixed(0)} {currency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-earth-600">{t("admin.dash.paid")}</span>
                <span className="text-sm font-black font-mono text-olive-600">{stats.paidRevenue?.toFixed(0)} {currency}</span>
              </div>
              <div className="border-t border-earth-200 pt-2 flex justify-between">
                <span className="text-sm font-black text-earth-900">{t("admin.dash.pending")}</span>
                <span className="text-sm font-black font-mono" style={{ color: "var(--accent-amber)" }}>{stats.pendingRevenue?.toFixed(0)} {currency}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {todayLogins.length > 0 && (
        <div className="earth-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <LogIn className="w-4 h-4 text-terracotta-500" />
            <h3 className="font-black text-earth-900 text-sm">{t("admin.dash.todayLogins")} ({todayLogins.length})</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {todayLogins.slice(0, 12).map((u: any) => (
              <div key={u.uid} className="flex items-center gap-2 bg-earth-50 border border-earth-200 rounded-sm p-2">
                <div className="w-7 h-7 rounded-sm bg-terracotta-500 border-l-2 border-terracotta-300 flex items-center justify-center text-white font-black text-xs shrink-0">
                  {(u.displayName || u.email || "?")[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-earth-900 truncate" title={u.displayName || u.email || ""}>{u.displayName || u.email}</p>
                  <p className="text-[10px] text-earth-500 flex items-center gap-1 font-mono">
                    <Clock className="w-2.5 h-2.5" />
                    {u.lastLogin ? new Date(u.lastLogin).toLocaleTimeString(getLang() === "ar" ? "ar-JO" : "en-GB", { hour: "2-digit", minute: "2-digit" }) : "—"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {analytics && (
        <div className="earth-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-olive-600" />
            <h3 className="font-black text-earth-900 text-sm">{t("admin.dash.moreDetails")}</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: t("admin.dash.suppliersCount"), value: analytics.totalSuppliers },
              { label: t("admin.dash.announcementsCount"), value: analytics.totalAnnouncements },
              { label: t("admin.dash.activeOffers"), value: analytics.activeOffers },
              { label: t("admin.dash.paidInvoices"), value: analytics.paidInvoices },
              { label: t("admin.dash.totalRevenue"), value: analytics.totalRevenue ? `${analytics.totalRevenue.toFixed(0)} ${currency}` : "—" },
              { label: t("admin.dash.online"), value: onlineCount },
            ].map((item) => (
              <div key={item.label} className="bg-earth-50 border border-earth-200 rounded-sm p-3 text-center">
                <p className="text-xs text-earth-500 font-bold">{item.label}</p>
                <p className="text-lg font-black font-mono text-earth-900">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
