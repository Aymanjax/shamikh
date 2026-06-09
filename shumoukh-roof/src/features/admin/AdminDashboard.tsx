// @ts-nocheck
import { useState, useEffect } from "react";
import {
  ShieldCheck, Users, Bell, FolderOpen, FileText,
  Truck, HardHat, Settings, History, Activity,
  Search, RotateCw, Ban, UserCheck, Shield,
  AlertCircle, Clock, CreditCard, Palette,
} from "lucide-react";
import { SUBSCRIPTION_TYPES, PLAN_OPTIONS, getSubscriptionLabel, getDaysRemaining } from "../../utils/subscriptionUtils";
import { listAllUsers, updateUserRole, toggleBan, setSubscriptionByDays } from "./adminUserService";
import type { UserProfile } from "./adminUserService";
import SubscriptionModal from "./SubscriptionModal";
import AnnouncementsTab from "./AnnouncementsTab";
import DashboardTab from "./DashboardTab";
import ProjectsTab from "./ProjectsTab";
import InvoicesTab from "./InvoicesTab";
import SuppliersTab from "./SuppliersTab";
import WorkersTab from "./WorkersTab";
import SystemConfigTab from "./SystemConfigTab";
import ThemeBrandingTab from "./ThemeBrandingTab";
import AuditLogsTab from "./AuditLogsTab";

type TabKey = "dashboard" | "users" | "projects" | "invoices" | "suppliers" | "workers" | "announcements" | "config" | "theme" | "audit";

const TABS: { key: TabKey; label: string; icon: any }[] = [
  { key: "dashboard", label: "لوحة", icon: ShieldCheck },
  { key: "users", label: "المستخدمين", icon: Users },
  { key: "projects", label: "المشاريع", icon: FolderOpen },
  { key: "invoices", label: "الفواتير", icon: FileText },
  { key: "suppliers", label: "الموردين", icon: Truck },
  { key: "workers", label: "العمال", icon: HardHat },
  { key: "announcements", label: "الإعلانات", icon: Bell },
  { key: "config", label: "الإعدادات", icon: Settings },
  { key: "theme", label: "المظهر والهوية", icon: Palette },
  { key: "audit", label: "السجل", icon: History },
];

const USER_FILTERS = [
  { key: "all", label: "الكل" },
  { key: "active", label: "نشطاء" },
  { key: "expired", label: "منتهي" },
  { key: "banned", label: "محظورين" },
  { key: "admins", label: "مديرين" },
];

export default function AdminDashboard() {
  const [tab, setTab] = useState<TabKey>("dashboard");
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [bulkPlan, setBulkPlan] = useState(SUBSCRIPTION_TYPES.FREE_TRIAL);
  const [bulkDays, setBulkDays] = useState(180);

  const loadUsers = async () => {
    setUsersLoading(true); setError("");
    try { setUsers(await listAllUsers()); }
    catch (e: any) { setError(e.message); }
    setUsersLoading(false);
  };

  useEffect(() => { if (tab === "users") loadUsers(); }, [tab]);

  const handleRole = async (uid: string, role: "user" | "admin") => {
    try {
      await updateUserRole(uid, role);
      setUsers((prev) => prev.map((u) => (u.uid === uid ? { ...u, role } : u)));
    } catch (e: any) { setError(e.message); }
  };

  const handleBan = async (uid: string, banned: boolean) => {
    try {
      await toggleBan(uid, banned);
      setUsers((prev) => prev.map((u) => (u.uid === uid ? { ...u, banned: !banned } : u)));
    } catch (e: any) { setError(e.message); }
  };

  const handleSubSave = async (uid: string, plan: string, opts: { days?: number; expiryDate?: string }) => {
    try {
      if (opts.days) await setSubscriptionByDays(uid, plan, opts.days);
      else await setSubscriptionByDays(uid, plan, 365);
      setSelectedUser(null);
      setUsers(await listAllUsers());
    } catch (e: any) { setError(e.message); }
  };

  const applySubscriptionToAll = async () => {
    const nonAdmins = users.filter((u) => u.role !== "admin" && !u.banned);
    for (const u of nonAdmins) {
      try { await setSubscriptionByDays(u.uid, bulkPlan, bulkDays); }
      catch { /* skip */ }
    }
    setUsers(await listAllUsers());
  };

  const filteredUsers = users
    .filter((u) => {
      if (filter === "admins") return u.role === "admin";
      if (filter === "banned") return u.banned;
      if (filter === "active") return u.subscription?.subscriptionType && !u.isExpired && !u.banned;
      if (filter === "expired") return u.isExpired;
      return true;
    })
    .filter((u) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (u.displayName?.toLowerCase() || "").includes(q) ||
        (u.email?.toLowerCase() || "").includes(q) ||
        (u.companyName?.toLowerCase() || "").includes(q);
    });

  const renderUsers = () => (
    <div className="space-y-4">
      <div className="glass-card p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-ice-blue-600" />
            <span className="font-black text-ink-primary">{users.length}</span>
            <span className="text-sm text-ink-muted">مستخدم</span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted" />
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث بالاسم أو البريد..."
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl py-2 pr-9 pl-3 text-sm text-ink-primary outline-none focus:border-ice-blue-500 transition font-medium" />
            </div>
            <button onClick={loadUsers} className="text-ink-muted hover:text-ink-secondary p-2 hover:bg-slate-100 rounded-lg transition border-2 border-transparent hover:border-slate-200" title="تحديث">
              <RotateCw className={`w-4 h-4 ${usersLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {USER_FILTERS.map((f) => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`text-xs font-black px-3 py-1.5 rounded-lg transition border-2 ${
                filter === f.key ? "bg-ice-blue-600 text-white border-ice-blue-600" : "bg-white text-ink-muted border-slate-200 hover:border-slate-300"
              }`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card p-3 flex flex-wrap items-center gap-2">
        <span className="text-xs font-black text-ink-muted whitespace-nowrap">اشتراك جماعي:</span>
        <select value={bulkPlan} onChange={(e) => setBulkPlan(e.target.value)}
          className="bg-white border-2 border-slate-200 rounded-lg py-1.5 px-2 text-xs text-ink-primary outline-none cursor-pointer font-medium">
          {PLAN_OPTIONS.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
        </select>
        <input type="number" value={bulkDays} onChange={(e) => setBulkDays(Number(e.target.value))} min="1"
          className="bg-white border-2 border-slate-200 rounded-lg py-1.5 px-2 text-xs text-ink-primary outline-none w-16 text-center font-medium" placeholder="أيام" />
        <button onClick={applySubscriptionToAll}
          className="bg-amber-600 hover:bg-amber-700 text-white py-1.5 px-4 rounded-lg text-xs font-bold transition whitespace-nowrap border-2 border-amber-600">
          تطبيق على الكل
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border-2 border-red-200 text-red-600 font-bold text-sm p-4 rounded-xl flex items-start gap-2">
          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {usersLoading ? (
        <div className="text-center py-12 text-ink-muted">
          <div className="animate-spin w-6 h-6 border-2 border-ice-blue-500 border-t-transparent rounded-full mx-auto mb-2" />
          <p className="text-sm font-bold">جاري التحميل...</p>
        </div>
      ) : filteredUsers.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {filteredUsers.map((u) => {
            const planLabel = getSubscriptionLabel(u.subscription?.subscriptionType);
            const remaining = getDaysRemaining(u.subscription?.subscriptionEndDate);
            const planColor = u.subscription?.subscriptionType === "free_trial" ? "text-amber-700 bg-amber-50 border-amber-200" :
              u.subscription?.subscriptionType === "basic" ? "text-emerald-700 bg-emerald-50 border-emerald-200" :
              u.subscription?.subscriptionType === "advanced" ? "text-amber-700 bg-amber-50 border-amber-200" :
              "text-slate-600 bg-slate-50 border-slate-200";
            return (
            <div key={u.uid} className="glass-card p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 shrink-0 rounded-lg bg-ice-blue-600 flex items-center justify-center text-white font-black text-sm">
                    {(u.displayName || u.email || "?")[0].toUpperCase()}
                  </div>
                  <div className="min-w-0 overflow-hidden">
                    <p className="text-sm font-black text-ink-primary truncate" title={u.displayName || "بلا اسم"}>{u.displayName || "بلا اسم"}</p>
                    <p className="text-xs text-ink-muted truncate" dir="ltr" title={u.email || ""}>{u.email}</p>
                    {u.companyName && <p className="text-xs text-ink-muted truncate" title={u.companyName}>{u.companyName}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {u.banned && <span className="text-xs font-black text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-lg">محظور</span>}
                  <span className={`text-xs font-black px-2 py-0.5 rounded-lg border-2 ${
                    u.role === "admin" ? "text-amber-600 bg-amber-50 border-amber-200" : "text-slate-600 bg-slate-50 border-slate-200"
                  }`}>
                    {u.role === "admin" ? "مدير" : "مستخدم"}
                  </span>
                </div>
              </div>
              {u.subscription?.subscriptionType && (
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-black px-2 py-0.5 rounded-lg border-2 ${planColor}`}>
                      <CreditCard className="w-3 h-3 inline ml-1" />{planLabel}
                    </span>
                    {u.subscription?.subscriptionType !== SUBSCRIPTION_TYPES.ADVANCED && (
                      <span className={`text-xs font-black ${u.isExpired ? "text-red-500" : "text-emerald-600"}`}>
                        {u.isExpired ? "منتهي" : `${remaining} يوم`}
                      </span>
                    )}
                  </div>
                  {u.subscription?.subscriptionType !== SUBSCRIPTION_TYPES.ADVANCED && u.subscription?.subscriptionEndDate && (
                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${u.isExpired ? "bg-red-400" : "bg-emerald-400"}`}
                        style={{ width: `${Math.min(100, Math.round((remaining / 180) * 100))}%` }} />
                    </div>
                  )}
                </div>
              )}
              <div className="flex items-center gap-1">
                {u.role !== "admin" && (
                  <button onClick={() => handleRole(u.uid, "admin")}
                    className="flex-1 text-xs font-black text-amber-600 bg-amber-50 hover:bg-amber-100 py-1.5 rounded-lg transition flex items-center justify-center gap-1 border-2 border-amber-200">
                    <Shield className="w-3 h-3" /> ترقية
                  </button>
                )}
                {u.role === "admin" && (
                  <button onClick={() => handleRole(u.uid, "user")}
                    className="flex-1 text-xs font-black text-slate-600 bg-slate-50 hover:bg-slate-100 py-1.5 rounded-lg transition flex items-center justify-center gap-1 border-2 border-slate-200">
                    <UserCheck className="w-3 h-3" /> تخفيض
                  </button>
                )}
                <button onClick={() => setSelectedUser(u)}
                  className="flex-1 text-xs font-black text-ice-blue-600 bg-ice-blue-50 hover:bg-ice-blue-100 py-1.5 rounded-lg transition flex items-center justify-center gap-1 border-2 border-ice-blue-200">
                  <Clock className="w-3 h-3" /> اشتراك
                </button>
                <button onClick={() => handleBan(u.uid, u.banned || false)}
                  className={`flex-1 text-xs font-black py-1.5 rounded-lg transition flex items-center justify-center gap-1 border-2 ${
                    u.banned
                      ? "text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border-emerald-200"
                      : "text-red-600 bg-red-50 hover:bg-red-100 border-red-200"
                  }`}>
                  {u.banned ? <UserCheck className="w-3 h-3" /> : <Ban className="w-3 h-3" />}
                  {u.banned ? "رفع" : "حظر"}
                </button>
              </div>
            </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 text-ink-muted">
          <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm font-black">لا يوجد مستخدمين مطابقين</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-5">
      <SubscriptionModal open={!!selectedUser} user={selectedUser} onClose={() => setSelectedUser(null)} onSave={handleSubSave} />

      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-red-600 flex items-center justify-center shadow-lg shadow-red-600/30">
          <ShieldCheck className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-black text-ink-primary tracking-tight">لوحة التحكم</h1>
          <p className="text-sm text-ink-muted">إدارة النظام والمستخدمين</p>
        </div>
      </div>

      <div className="grid grid-cols-3 lg:grid-cols-5 gap-1.5">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`relative py-2.5 px-1 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 border-2 ${
              tab === t.key
                ? "bg-red-600 text-white border-red-600 shadow-lg shadow-red-600/20"
                : "bg-white border-slate-200 text-ink-muted hover:text-ink-secondary hover:border-slate-300"
            }`}>
            <t.icon className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {tab === "dashboard" && <DashboardTab />}
      {tab === "users" && renderUsers()}
      {tab === "projects" && <ProjectsTab />}
      {tab === "invoices" && <InvoicesTab />}
      {tab === "suppliers" && <SuppliersTab />}
      {tab === "workers" && <WorkersTab />}
      {tab === "announcements" && <AnnouncementsTab />}
      {tab === "config" && <SystemConfigTab />}
      {tab === "theme" && <ThemeBrandingTab />}
      {tab === "audit" && <AuditLogsTab />}
    </div>
  );
}
