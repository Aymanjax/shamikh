import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { useAuthStore } from "../../store/authStore";

export default function AppLayout() {
  const { user } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-surface-alt">
      <Sidebar user={user} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="flex-1 p-3 md:p-6 overflow-y-auto min-w-0">
        <button onClick={() => setSidebarOpen(true)}
          className="md:hidden fixed top-3 right-3 z-30 w-10 h-10 bg-surface border border-line rounded-xl flex items-center justify-center shadow-lg">
          <i className="fa-solid fa-bars text-ink"></i>
        </button>
        <div className="mt-10 md:mt-0">
          <Outlet />
        </div>
        <div className="mt-8 pt-4 border-t border-line text-center text-[10px] text-ink-muted">
          <span className="flex items-center justify-center gap-2">
            <i className="fa-regular fa-circle-question text-amber-500"></i>
            في مشكلة؟ تواصل على
            <a href="https://wa.me/962788859723" target="_blank" rel="noopener noreferrer"
              className="text-emerald-600 hover:text-emerald-700 font-bold inline-flex items-center gap-1">
              <i className="fa-brands fa-whatsapp"></i> واتساب
            </a>
            أو
            <a href="https://t.me/+962788859723" target="_blank" rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-600 font-bold inline-flex items-center gap-1">
              <i className="fa-brands fa-telegram"></i> تيليجرام
            </a>
          </span>
        </div>
      </main>
    </div>
  );
}
