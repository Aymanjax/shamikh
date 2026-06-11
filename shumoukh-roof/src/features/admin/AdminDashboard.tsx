// @ts-nocheck
import { useState, useEffect } from "react";
import {
  ShieldCheck, Users, Bell, FolderOpen, FileText,
  Truck, HardHat, Settings, History,
  Search, RotateCw, Ban, UserCheck, Shield,
  AlertCircle, Clock, CreditCard,
} from "lucide-react";
import { SUBSCRIPTION_TYPES, PLAN_OPTIONS, getDaysRemaining } from "../../utils/subscriptionUtils";
import { useT } from "../../i18n";
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
import AuditLogsTab from "./AuditLogsTab";

type TabKey = "dashboard" | "users" | "projects" | "invoices" | "suppliers" | "workers" | "announcements" | "config" | "audit";

const TABS: { key: TabKey; label: string; icon: any }[] = [
  { key: "dashboard", label: "admin.tabs.dashboard", icon: ShieldCheck },
  { key: "users", label: "admin.tabs.users", icon: Users },
  { key: "projects", label: "nav.projects", icon: FolderOpen },
  { key: "invoices", label: "nav.invoices", icon: FileText },
  { key: "suppliers", label: "admin.tabs.suppliers", icon: Truck },
  { key: "workers", label: "nav.workers", icon: HardHat },
  { key: "announcements", label: "admin.tabs.announcements", icon: Bell },
  { key: "config", label: "nav.settings", icon: Settings },
  { key: "audit", label: "admin.tabs.audit", icon: History },
];

const USER_FILTERS = [
  { key: "all", label: "common.all" },
  { key: "active", label: "admin.users.filter.active" },
  { key: "expired", label: "common.expired" },
  { key: "banned", label: "admin.users.filter.banned" },
  { key: "admins", label: "admin.users.filter.admins" },
];

const PLAN_TAG_CLASSES: Record<string, string> = {
  free_trial: "tag-amber",
  basic: "tag-olive",
  advanced: "tag-terracotta",
};

// مفتاح ترجمة خطة الاشتراك — القيم المخزنة تبقى كما هي وتُترجم وقت العرض فقط
const PLAN_KEYS = ["free_trial", "limited", "basic", "advanced"];
const planLabelKey = (type?: string) =>
  PLAN_KEYS.includes(type || "") ? `admin.plan.${type}` : "admin.plan.none";

export default function AdminDashboard() {
  const t = useT();
  const [tab, setTab] = useState<TabKey>("dashboard");
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [bulkPlan, setBulkPlan] = useState(SUBSCRIPTION_TYPES.FREE_TRIAL);
  const [bulkDays, setBulkDays] = useState(180);
  const [bulkApplying, setBulkApplying] = useState(false);

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
    const planLabel = t(planLabelKey(bulkPlan));
    if (!confirm(t("admin.users.bulkConfirm", { plan: planLabel, days: bulkDays, count: nonAdmins.length }))) return;
    setBulkApplying(true);
    for (const u of nonAdmins) {
      try { await setSubscriptionByDays(u.uid, bulkPlan, bulkDays); }
      catch { /* تخطي المستخدم عند الفشل وإكمال الباقي */ }
    }
    setUsers(await listAllUsers());
    setBulkApplying(false);
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
      <div className="earth-card p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-terracotta-500" />
            <span className="font-black font-mono text-earth-900">{users.length}</span>
            <span className="text-sm text-earth-500 font-bold">{t("admin.users.countLabel")}</span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-earth-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder={t("admin.users.searchPlaceholder")}
                className="w-full bg-white border-2 border-earth-200 rounded-xl py-2 pr-9 pl-3 text-sm text-earth-900 outline-none focus:border-terracotta-400 focus:ring-2 focus:ring-terracotta-100 transition placeholder:text-earth-400" />
            </div>
            <button onClick={loadUsers} className="text-earth-500 hover:text-earth-700 p-2 hover:bg-earth-100 rounded-sm transition cursor-pointer" title={t("admin.users.refreshList")} aria-label={t("admin.users.refreshList")}>
              <RotateCw className={`w-4 h-4 ${usersLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {USER_FILTERS.map((f) => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`text-xs font-black px-3 py-1.5 rounded-sm transition border cursor-pointer ${
                filter === f.key
                  ? "bg-earth-800 text-white border-earth-800"
                  : "bg-white text-earth-600 border-earth-200 hover:border-earth-300"
              }`}>
              {t(f.label)}
            </button>
          ))}
        </div>
      </div>

      <div className="earth-card p-3 flex flex-wrap items-center gap-2">
        <span className="text-xs font-black text-earth-600 whitespace-nowrap">{t("admin.users.bulkLabel")}</span>
        <select value={bulkPlan} onChange={(e) => setBulkPlan(e.target.value)}
          className="bg-white border-2 border-earth-200 rounded-sm py-1.5 px-2 text-xs text-earth-900 outline-none cursor-pointer font-bold focus:border-terracotta-400">
          {PLAN_OPTIONS.map((o) => (<option key={o.value} value={o.value}>{t(planLabelKey(o.value))}</option>))}
        </select>
        <input type="number" value={bulkDays} onChange={(e) => setBulkDays(Number(e.target.value))} min="1"
          className="bg-white border-2 border-earth-200 rounded-sm py-1.5 px-2 text-xs text-earth-900 outline-none w-20 text-center font-mono font-black focus:border-terracotta-400" aria-label={t("admin.daysCount")} />
        <span className="text-[10px] text-earth-500 font-bold">{t("common.day")}</span>
        <button onClick={applySubscriptionToAll} disabled={bulkApplying || users.length === 0}
          className="bg-terracotta-500 hover:bg-terracotta-600 active:bg-terracotta-700 disabled:opacity-40 text-white py-1.5 px-4 rounded-sm text-xs font-bold transition whitespace-nowrap border-r-3 border-terracotta-700 cursor-pointer">
          {bulkApplying ? t("admin.users.applying") : t("admin.users.applyToAll")}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 font-bold text-sm p-4 rounded-sm flex items-start gap-2" role="alert">
          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {usersLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-40 rounded-sm shimmer-skeleton" />
          ))}
        </div>
      ) : filteredUsers.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {filteredUsers.map((u) => {
            const planLabel = t(planLabelKey(u.subscription?.subscriptionType));
            const remaining = getDaysRemaining(u.subscription?.subscriptionEndDate);
            const planTag = PLAN_TAG_CLASSES[u.subscription?.subscriptionType || ""] || "bg-earth-100 text-earth-700 border-earth-300";
            return (
              <div key={u.uid} className="earth-card p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 shrink-0 rounded-sm bg-terracotta-500 border-l-2 border-terracotta-300 flex items-center justify-center text-white font-black text-sm">
                      {(u.displayName || u.email || "?")[0].toUpperCase()}
                    </div>
                    <div className="min-w-0 overflow-hidden">
                      <p className="text-sm font-black text-earth-900 truncate" title={u.displayName || t("admin.users.noName")}>{u.displayName || t("admin.users.noName")}</p>
                      <p className="text-xs text-earth-500 truncate" dir="ltr" title={u.email || ""}>{u.email}</p>
                      {u.companyName && <p className="text-xs text-earth-500 truncate" title={u.companyName}>{u.companyName}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {u.banned && <span className="text-[10px] font-black text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-[3px]">{t("admin.banned")}</span>}
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-[3px] border ${
                      u.role === "admin" ? "tag-terracotta" : "bg-earth-100 text-earth-600 border-earth-200"
                    }`}>
                      {u.role === "admin" ? t("admin.users.role.admin") : t("admin.users.role.user")}
                    </span>
                  </div>
                </div>
                {u.subscription?.subscriptionType && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-[3px] border inline-flex items-center gap-1 ${planTag}`}>
                        <CreditCard className="w-3 h-3" />{planLabel}
                      </span>
                      <span className={`text-[10px] font-black font-mono ${u.isExpired ? "text-red-500" : "text-olive-600"}`}>
                        {u.isExpired ? t("common.expired") : t("common.days", { n: remaining })}
                      </span>
                    </div>
                    {u.subscription?.subscriptionEndDate && (
                      <div className="w-full h-1.5 bg-earth-100 rounded-[3px] overflow-hidden">
                        <div className={`h-full transition-all ${u.isExpired ? "bg-red-400" : "bg-olive-500"}`}
                          style={{ width: `${Math.min(100, Math.round((remaining / 180) * 100))}%` }} />
                      </div>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-1">
                  {u.role !== "admin" ? (
                    <button onClick={() => handleRole(u.uid, "admin")}
                      className="flex-1 text-[10px] font-black text-amber-700 bg-amber-50 hover:bg-amber-100 py-1.5 rounded-sm transition flex items-center justify-center gap-1 border border-amber-200 cursor-pointer">
                      <Shield className="w-3 h-3" /> {t("admin.users.promote")}
                    </button>
                  ) : (
                    <button onClick={() => handleRole(u.uid, "user")}
                      className="flex-1 text-[10px] font-black text-earth-600 bg-earth-50 hover:bg-earth-100 py-1.5 rounded-sm transition flex items-center justify-center gap-1 border border-earth-200 cursor-pointer">
                      <UserCheck className="w-3 h-3" /> {t("admin.users.demote")}
                    </button>
                  )}
                  <button onClick={() => setSelectedUser(u)}
                    className="flex-1 text-[10px] font-black text-olive-700 bg-olive-50 hover:bg-olive-100 py-1.5 rounded-sm transition flex items-center justify-center gap-1 border border-olive-200 cursor-pointer">
                    <Clock className="w-3 h-3" /> {t("admin.users.subscription")}
                  </button>
                  <button onClick={() => handleBan(u.uid, u.banned || false)}
                    className={`flex-1 text-[10px] font-black py-1.5 rounded-sm transition flex items-center justify-center gap-1 border cursor-pointer ${
                      u.banned
                        ? "text-olive-700 bg-olive-50 hover:bg-olive-100 border-olive-200"
                        : "text-red-600 bg-red-50 hover:bg-red-100 border-red-200"
                    }`}>
                    {u.banned ? <UserCheck className="w-3 h-3" /> : <Ban className="w-3 h-3" />}
                    {u.banned ? t("admin.unban") : t("admin.ban")}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 text-earth-500">
          <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm font-black">{t("admin.users.empty")}</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-5">
      <SubscriptionModal open={!!selectedUser} user={selectedUser} onClose={() => setSelectedUser(null)} onSave={handleSubSave} />

      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-sm bg-earth-800 flex items-center justify-center border-l-3 border-terracotta-500 shrink-0">
          <ShieldCheck className="w-6 h-6 text-terracotta-400" />
        </div>
        <div>
          <h1 className="text-xl font-black text-earth-900 tracking-tight">{t("admin.title")}</h1>
          <p className="text-sm text-earth-500">{t("admin.subtitle")}</p>
        </div>
      </div>

      <div className="bg-white border border-earth-200 rounded-sm p-1.5 flex flex-wrap gap-1">
        {TABS.map((tb) => (
          <button key={tb.key} onClick={() => setTab(tb.key)}
            className={`py-2 px-3 rounded-sm text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              tab === tb.key
                ? "bg-earth-800 text-white border-r-2 border-terracotta-500"
                : "bg-transparent text-earth-500 hover:text-earth-700 hover:bg-earth-50 border-r-2 border-transparent"
            }`}>
            <tb.icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t(tb.label)}</span>
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
      {tab === "audit" && <AuditLogsTab />}
    </div>
  );
}
