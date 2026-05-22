import { NavLink, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { logoutUser } from "../../services/authService";
import { useAuthStore } from "../../store/authStore";
import { useTheme } from "../../hooks/useTheme";
import { getActiveOffers } from "../../services/supplierService";

const allLinks = [
  { to: "/", icon: "fa-chart-pie", label: "الرئيسية", premium: false },
  { to: "/projects", icon: "fa-folder-open", label: "المشاريع", premium: true },
  { to: "/invoices", icon: "fa-file-invoice", label: "الفواتير", premium: true },
  { to: "/calculator", icon: "fa-calculator", label: "حساب البضاعة", premium: false },
  { to: "/suppliers", icon: "fa-truck", label: "الموردين", premium: true },
  { to: "/workers", icon: "fa-users-gear", label: "العمال والرواتب", premium: true },
  { to: "/reports", icon: "fa-file-alt", label: "التقارير", premium: true },
  { to: "/settings", icon: "fa-cog", label: "الإعدادات", premium: false },
];

export default function Sidebar({ user, open, onClose }) {
  const role = useAuthStore((s) => s.role);
  const plan = useAuthStore((s) => s.subscription?.plan);
  const companyName = useAuthStore((s) => s.companyName);
  const { theme, toggle } = useTheme();
  const [offersCount, setOffersCount] = useState(0);
  const isPremium = plan === "premium" || plan === "trial" || plan === "lifetime" || role === "admin";
  const links = isPremium ? allLinks : allLinks.filter((l) => !l.premium);

  useEffect(() => {
    getActiveOffers().then((l) => setOffersCount(l.length)).catch(() => {});
  }, []);

  const closeAndNav = () => {
    if (onClose) onClose();
  };

  return (
    <>
      {open && (
        <div onClick={onClose} className="md:hidden fixed inset-0 bg-black/60 z-40"></div>
      )}

      <aside className={`fixed md:sticky top-0 right-0 z-50 h-screen w-64 bg-surface border-l border-line flex flex-col shadow-lg transition-transform duration-300 ${
        open ? "translate-x-0" : "translate-x-full md:translate-x-0"
      }`}>
        <div className="p-5 border-b border-line flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="شموخ" className="w-10 h-10 object-contain" />
            <div>
              <h2 className="text-sm font-black text-ink">{companyName || "شموخ ERP"}</h2>
              <p className="text-[10px] text-ink-muted">نظام إدارة المشاريع</p>
            </div>
          </div>
          <button onClick={onClose} className="md:hidden text-ink-muted hover:text-ink p-1">
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              onClick={closeAndNav}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  isActive
                    ? "bg-amber-50 text-amber-600 border border-amber-200"
                    : "text-ink-muted hover:text-ink hover:bg-surface-subtle"
                }`
              }
            >
              <i className={`fa-solid ${link.icon} w-5 text-center`}></i>
              <span className="flex-1">{link.label}</span>
              {link.to === "/suppliers" && offersCount > 0 && (
                <span className="text-[9px] font-bold text-red-600 bg-red-50 border border-red-200 rounded-full px-2 py-0.5 flex items-center gap-1">
                  <i className="fa-solid fa-fire text-[8px]"></i> {offersCount}
                </span>
              )}
            </NavLink>
          ))}
          {role === "admin" && (
            <NavLink
              to="/admin"
              onClick={closeAndNav}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  isActive
                    ? "bg-red-50 text-red-600 border border-red-200"
                    : "text-ink-muted hover:text-ink hover:bg-surface-subtle"
                }`
              }
            >
              <i className="fa-solid fa-shield-halved w-5 text-center"></i>
              التحكم
            </NavLink>
          )}
          {!isPremium && (
            <Link
              to="/plans"
              onClick={closeAndNav}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-l from-amber-500 to-amber-600 text-white shadow-lg hover:shadow-xl transition-all"
            >
              <i className="fa-solid fa-crown w-5 text-center"></i>
              ترقية الاشتراك
            </Link>
          )}
        </nav>

        <div className="p-3 border-t border-line space-y-1">
          <button onClick={toggle}
            className="flex items-center gap-3 w-full px-4 py-2 rounded-xl text-sm font-bold text-ink-muted hover:text-ink hover:bg-surface-subtle transition">
            <i className={`fa-solid w-5 text-center ${theme === "dark" ? "fa-sun" : "fa-moon"}`}></i>
            {theme === "dark" ? "الوضع النهاري" : "الوضع الليلي"}
          </button>
          <div className="flex items-center gap-3 px-4 py-2.5 text-xs text-ink-muted">
            <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
              {user?.displayName?.charAt(0) || user?.email?.charAt(0) || "?"}
            </div>
            <div className="flex-1 truncate min-w-0">
              <p className="text-ink text-sm font-bold truncate">{user?.displayName || "مستخدم"}</p>
              <p className="text-[10px] truncate">{user?.email}</p>
            </div>
            <button onClick={logoutUser} className="text-red-500 hover:text-red-600 shrink-0" title="تسجيل خروج">
              <i className="fa-solid fa-right-from-bracket"></i>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}