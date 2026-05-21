import { NavLink } from "react-router-dom";
import { logoutUser } from "../../services/authService";
import { useAuthStore } from "../../store/authStore";

const links = [
  { to: "/", icon: "fa-chart-pie", label: "لوحة الأرباح" },
  { to: "/projects", icon: "fa-folder-open", label: "المشاريع" },
  { to: "/calculator", icon: "fa-calculator", label: "الحاسبة" },
  { to: "/suppliers", icon: "fa-truck", label: "الموردين" },
  { to: "/inventory", icon: "fa-warehouse", label: "المخزون" },
  { to: "/reports", icon: "fa-file-alt", label: "التقارير" },
  { to: "/settings", icon: "fa-cog", label: "الإعدادات" },
];

export default function Sidebar({ user }) {
  const role = useAuthStore((s) => s.role);

  return (
    <aside className="w-64 bg-[#0f172a] border-l border-white/5 flex flex-col h-screen sticky top-0">
      <div className="p-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-brand-600 to-amber-500 p-2.5 rounded-2xl shadow-lg shadow-brand-600/30">
            <i className="fa-solid fa-hotel text-white text-xl"></i>
          </div>
          <div>
            <h2 className="text-sm font-black">شامخ ERP</h2>
            <p className="text-[10px] text-slate-400">نظام إدارة المشاريع</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                isActive
                  ? "bg-brand-600/20 text-brand-400 border border-brand-600/20"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`
            }
          >
            <i className={`fa-solid ${link.icon} w-5 text-center`}></i>
            {link.label}
          </NavLink>
        ))}
        {role === "admin" && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                isActive
                  ? "bg-red-600/20 text-red-400 border border-red-600/20"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`
            }
          >
            <i className="fa-solid fa-shield-halved w-5 text-center"></i>
            التحكم
          </NavLink>
        )}
      </nav>

      <div className="p-3 border-t border-white/5">
        <div className="flex items-center gap-3 px-4 py-2.5 text-xs text-slate-400">
          <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white font-bold text-sm">
            {user?.displayName?.charAt(0) || user?.email?.charAt(0) || "?"}
          </div>
          <div className="flex-1 truncate">
            <p className="text-white text-sm font-bold truncate">{user?.displayName || "مستخدم"}</p>
            <p className="text-[10px] truncate">{user?.email}</p>
          </div>
          <button onClick={logoutUser} className="text-red-400 hover:text-red-300" title="تسجيل خروج">
            <i className="fa-solid fa-right-from-bracket"></i>
          </button>
        </div>
      </div>
    </aside>
  );
}
