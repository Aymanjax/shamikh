// @ts-nocheck
import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Calculator,
  FolderOpen,
  FileText,
  Users,
  Settings,
  ShieldCheck,
  LogOut,
  ChevronUp,
} from "lucide-react";
import { logoutUser } from "../../features/auth/authService";
import { useAuthStore } from "../../store/authStore";
import NotificationBell from "../ui/NotificationBell";

interface NavItem {
  to: string;
  icon: typeof LayoutDashboard;
  label: string;
  adminOnly?: boolean;
}

const links: NavItem[] = [
  { to: "/", icon: LayoutDashboard, label: "الرئيسية" },
  { to: "/calculator", icon: Calculator, label: "حساب البضاعة" },
  { to: "/projects", icon: FolderOpen, label: "المشاريع" },
  { to: "/invoices", icon: FileText, label: "الفواتير" },
  { to: "/workers", icon: Users, label: "العمال" },
  { to: "/settings", icon: Settings, label: "الإعدادات" },
  { to: "/admin", icon: ShieldCheck, label: "التحكم", adminOnly: true },
];

export default function FloatingCommandBar({ isAdmin }: { isAdmin: boolean }) {
  const [collapsed, setCollapsed] = useState(false);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const visibleLinks = isAdmin ? links : links.filter((l) => !l.adminOnly);

  const handleLogout = async () => {
    await logoutUser();
    logout();
    navigate("/login");
  };

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-deep-earth-900 border border-deep-earth-700 rounded-sm p-3 shadow-lg cursor-pointer"
        aria-label="فتح القائمة"
      >
        <ChevronUp className="w-5 h-5 text-terracotta-400" />
      </button>
    );
  }

  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-xl">
      <div className="bg-deep-earth-900 border border-deep-earth-700 rounded-sm px-1.5 py-1 flex items-center justify-around gap-0 shadow-lg">
        <div className="flex items-center">
          <NotificationBell position="center" />
        </div>
        {visibleLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === "/"}
            className={({ isActive }) =>
              [
                "relative flex flex-col items-center justify-center gap-0.5",
                "px-2 py-1.5 rounded-sm transition-all duration-150 min-w-[48px]",
                isActive
                  ? "bg-terracotta-500/10 text-terracotta-400 border-t-2 border-terracotta-500"
                  : "text-earth-500 hover:text-earth-300 hover:bg-deep-earth-800 border-t-2 border-transparent",
              ].join(" ")
            }
          >
            <link.icon className="w-4 h-4" />
            <span className="text-[8px] font-bold whitespace-nowrap">
              {link.label}
            </span>
          </NavLink>
        ))}

        <div className="w-px h-6 bg-deep-earth-700" />

        <button
          onClick={handleLogout}
          className="flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 rounded-sm text-earth-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150 min-w-[48px] cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-[8px] font-bold">خروج</span>
        </button>

        <button
          onClick={() => setCollapsed(true)}
          className="flex flex-col items-center justify-center gap-0.5 px-1 py-1.5 rounded-sm text-earth-500 hover:text-earth-300 hover:bg-deep-earth-800 transition-all duration-150 cursor-pointer"
          aria-label="طي القائمة"
        >
          <ChevronUp className="w-4 h-4" />
          <span className="text-[8px] font-bold">طي</span>
        </button>
      </div>
    </nav>
  );
}