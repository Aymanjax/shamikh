// @ts-nocheck
import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, Calculator, FolderOpen, FileText, Users, Settings, ShieldCheck, LogOut, Home, CreditCard, ChevronRight } from "lucide-react";
import { logoutUser } from "../../features/auth/authService";
import { useAuthStore } from "../../store/authStore";
import { getSubscriptionLabel, getDaysRemaining } from "../../utils/subscriptionUtils";
import NotificationBell from "../ui/NotificationBell";
import { useT } from "../../i18n";

const links = [
  { to: "/", icon: LayoutDashboard, labelKey: "nav.home" },
  { to: "/calculator", icon: Calculator, labelKey: "nav.calculator" },
  { to: "/projects", icon: FolderOpen, labelKey: "nav.projects" },
  { to: "/invoices", icon: FileText, labelKey: "nav.invoices" },
  { to: "/workers", icon: Users, labelKey: "nav.workers" },
  { to: "/subscription", icon: CreditCard, labelKey: "nav.subscription" },
  { to: "/settings", icon: Settings, labelKey: "nav.settings" },
  { to: "/admin", icon: ShieldCheck, labelKey: "nav.admin", adminOnly: true },
];

export default function Sidebar({ isAdmin, collapsed, onToggle }: { isAdmin: boolean; collapsed: boolean; onToggle: () => void }) {
  const t = useT();
  const user = useAuthStore((s) => s.user);
  const subscription = useAuthStore((s) => (s as any).subscription);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logoutUser();
    logout();
    navigate("/login");
  };

  return (
    <aside className={`bg-deep-earth-900 border-l border-deep-earth-700 flex flex-col shrink-0 sticky top-0 h-screen transition-all duration-300 ${collapsed ? "w-16" : "w-60"}`}>
      {/* Logo */}
      <div className={`border-b border-deep-earth-700 flex items-center ${collapsed ? "justify-center p-3" : "p-4 gap-3"}`}>
        <div className="w-8 h-8 rounded-sm bg-terracotta-500 flex items-center justify-center shrink-0 border-l-2 border-terracotta-300">
          <Home className="w-4 h-4 text-paper" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <h2 className="text-sm font-black text-paper tracking-tight">{t("app.name")}</h2>
            <p className="text-[9px] text-earth-500">{t("app.tagline")}</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className={`flex-1 py-2 space-y-0.5 overflow-y-auto ${collapsed ? "px-1.5" : "px-2"}`}>
        {links.map((link) => {
          if (link.adminOnly && !isAdmin) return null;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-sm font-bold transition-all duration-150 ${
                  collapsed ? "justify-center p-2.5" : "px-3 py-2"
                } ${
                  isActive
                    ? "bg-terracotta-500/10 text-terracotta-400 border-r-2 border-terracotta-500"
                    : "text-earth-500 hover:text-earth-300 hover:bg-deep-earth-800 border-r-2 border-transparent"
                }`
              }
            >
              <link.icon className={`shrink-0 ${collapsed ? "w-5 h-5" : "w-5 h-5"}`} />
              {!collapsed && <span className="text-sm">{t(link.labelKey)}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* User & Logout */}
      <div className={`border-t border-deep-earth-700 py-2 ${collapsed ? "px-1.5 space-y-1" : "px-2 space-y-1"}`}>
        {user && !collapsed && (
          <div className="px-3 py-2">
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="w-7 h-7 shrink-0 rounded-sm bg-terracotta-500 flex items-center justify-center text-earth-100 font-black text-xs border-l-2 border-terracotta-300">
                {user.displayName?.charAt(0) || user.email?.charAt(0) || "?"}
              </div>
              <div className="flex-1 min-w-0 overflow-hidden">
                <p className="text-xs font-bold text-paper truncate" title={user.displayName || ""}>{user.displayName || t("nav.user")}</p>
                <p className="text-[9px] text-earth-500 truncate" title={user.email || ""}>{user.email}</p>
              </div>
            </div>
            {subscription?.subscriptionType && (
              <NavLink to="/subscription" className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
                <CreditCard className="w-3 h-3 text-terracotta-400" />
                <span className="text-[9px] font-bold text-terracotta-400">{getSubscriptionLabel(subscription.subscriptionType)}</span>
                {subscription.subscriptionEndDate && (
                  <span className={`text-[8px] ${getDaysRemaining(subscription.subscriptionEndDate) > 0 ? "text-earth-500" : "text-red-400"}`}>
                    · {getDaysRemaining(subscription.subscriptionEndDate) > 0 ? t("common.days", { n: getDaysRemaining(subscription.subscriptionEndDate) }) : t("common.expired")}
                  </span>
                )}
              </NavLink>
            )}
          </div>
        )}
        <div className={`flex items-center ${collapsed ? "justify-center px-1.5" : "px-2"}`}>
          <NotificationBell collapsed={collapsed} position="right" />
        </div>
        <button onClick={handleLogout}
          className={`flex items-center gap-3 w-full rounded-sm font-bold transition text-earth-500 hover:text-red-400 hover:bg-red-500/10 ${
            collapsed ? "justify-center p-2.5" : "px-3 py-2 text-sm"
          }`}>
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span>{t("nav.logout")}</span>}
        </button>
        <button onClick={onToggle}
          className={`flex items-center gap-3 w-full rounded-sm font-bold transition text-earth-500 hover:text-earth-300 hover:bg-deep-earth-800 ${
            collapsed ? "justify-center p-2.5" : "px-3 py-2 text-sm"
          }`}>
          <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${collapsed ? "rotate-180" : ""}`} />
          {!collapsed && <span>{t("nav.collapseMenu")}</span>}
        </button>
      </div>
    </aside>
  );
}