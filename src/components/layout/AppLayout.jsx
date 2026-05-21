import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { useAuthStore } from "../../store/authStore";

export default function AppLayout() {
  const { user } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#020617]">
      <Sidebar user={user} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="flex-1 p-3 md:p-6 overflow-y-auto min-w-0">
        <button onClick={() => setSidebarOpen(true)}
          className="md:hidden fixed top-3 right-3 z-30 w-10 h-10 bg-[#0f172a] border border-white/10 rounded-xl flex items-center justify-center shadow-lg">
          <i className="fa-solid fa-bars text-white"></i>
        </button>
        <div className="mt-10 md:mt-0">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
